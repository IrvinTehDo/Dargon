// const bossHandler = require('./bossHandler.js');
const classes = require('./../classes');

// Import character templates
const charTemplates = require('./charTemplates');

const physics = require('./../physics/index.js');

const getAvailableChars = () => charTemplates;
const validateChar = id => charTemplates[id] !== undefined;
const getChar = id => charTemplates[id];

const { Dragon } = classes;

const bosses = {};

const hasBoss = roomId => bosses[roomId] !== undefined;

const getBoss = roomId => bosses[roomId].being;

let prevAttackTime = new Date().getTime();

const takeDamage = (roomId, damage, io) => {
  bosses[roomId].being.currentHealth -= damage;
  console.log(`${bosses[roomId].being.sprite} takes ${damage} damage. Current health: ${bosses[roomId].being.currentHealth}`);

  // SUPER DUPER TEMPORARY, resets health to 100 if boss hp is at 0.
  if (bosses[roomId].being.currentHealth <= 0) {
    bosses[roomId].being.currentHealth = 100;
    console.log('resetting health to 100');
  }

  io.sockets.in(roomId).emit('updateBoss', { currentHealth: bosses[roomId].being.currentHealth });
};

const spawnBoss = (roomId, callback) => {
  const randX = Math.floor(Math.random() * 200) + 96;
  const randY = Math.floor(Math.random() * 200) + 96;

  bosses[roomId] = {
    being: new Dragon(
      { x: randX, y: randY },
      {
        strength: 10, defense: 10, health: 100, speed: 4,
      },
      roomId,
    ),
    targetLoc: undefined,
    idleTicks: 0,
    targetIdleTicks: 0,
    attackTicks: 0,
    attacks: [],
    attacksToResolve: [],
  };

  callback(getBoss(roomId));
};

const assignTargetLoc = (bossObj) => {
  const boss = bossObj;

  boss.idleTicks = 0;
  boss.targetIdleTicks = Math.floor(Math.random() * boss.being.maxIdleTicks);

  boss.targetLoc = {
    x: Math.floor(Math.random() * 500) + 96,
    y: Math.floor(Math.random() * 500) + 96,
  };

  const xDiff = boss.being.x - boss.targetLoc.x;
  const yDiff = boss.being.y - boss.targetLoc.y;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    boss.being.direction = xDiff > 0 ? boss.being.DIRECTIONS.left : boss.being.DIRECTIONS.right;
  } else {
    boss.being.direction = yDiff > 0 ? boss.being.DIRECTIONS.up : boss.being.DIRECTIONS.down;
  }
};

const spawnBossAttack = (bossKey) => {
  const randX = Math.floor(Math.random() * 400);
  const randWidth = Math.floor(Math.random() * 150) + 50;

  const randY = Math.floor(Math.random() * 400);
  const randHeight = Math.floor(Math.random() * 150) + 50;

  const attack = {
    id: `${new Date().getTime()}${bosses[bossKey].attacks.length}`,
    x: randX,
    y: randY,
    w: randWidth,
    h: randHeight,
    progress: 0,
    complete: 3000,
  };

  bosses[bossKey].attacks.push(attack);
};

const updateBosses = (callback) => {
  const bossKeys = Object.keys(bosses);

  for (let i = 0; i < bossKeys.length; i++) {
    const bossObj = bosses[bossKeys[i]];
    const boss = bossObj.being;

    bossObj.attackTicks++;
    if (bossObj.attackTicks >= boss.attackFreq) {
      bossObj.attackTicks = 0;
      spawnBossAttack(bossKeys[i]);
    }

    if (!bossObj.targetLoc) {
      if (bossObj.idleTicks >= bossObj.targetIdleTicks) {
        assignTargetLoc(bossObj);
      } else {
        bossObj.idleTicks++;
      }
    } else {
      boss.prevX = boss.x;
      boss.prevY = boss.y;

      const xDiff = bossObj.targetLoc.x - boss.x;
      const yDiff = bossObj.targetLoc.y - boss.y;

      if (Math.abs(xDiff) >= boss.speed) {
        boss.x += xDiff >= 0 ? boss.speed : -boss.speed;
      } else {
        boss.x = bossObj.targetLoc.x;
      }

      if (Math.abs(yDiff) >= boss.speed) {
        boss.y += yDiff >= 0 ? boss.speed : -boss.speed;
      } else {
        boss.y = bossObj.targetLoc.y;
      }

      boss.ratio = 0.05;

      if (xDiff === 0 && yDiff === 0) {
        boss.anim = boss.ANIMS.idle;
        bossObj.targetLoc = undefined;
      } else {
        boss.anim = boss.ANIMS.walk;
      }

      callback(boss.room, {
        prevX: boss.prevX,
        prevY: boss.prevY,
        destX: boss.x,
        destY: boss.y,
        anim: boss.anim,
        direction: boss.direction,
        ratio: boss.ratio,
      });
    }
  }
};

const updateBossAttacks = (callback) => {
  const bossKeys = Object.keys(bosses);

  const currentTime = new Date().getTime();
  const timePassed = currentTime - prevAttackTime;
  prevAttackTime = currentTime;

  for (let i = 0; i < bossKeys.length; i++) {
    const boss = bosses[bossKeys[i]];

    for (let j = 0; j < boss.attacks.length; j++) {
      const attack = boss.attacks[j];
      attack.progress += timePassed;

      callback(boss.being.room, attack);

      if (attack.progress > attack.complete) {
        boss.attacksToResolve.push(attack);
        boss.attacks.splice(j, 1);
      }
    }
  }
};

const resolveBossAttacks = (players, rooms, removeAttack, updatePlayer) => {
  const bossKeys = Object.keys(bosses);

  for (let i = 0; i < bossKeys.length; i++) {
    const boss = bosses[bossKeys[i]];
    const { room } = boss.being;
    const socketIds = Object.keys(rooms[room].players);

    for (let j = 0; j < boss.attacksToResolve.length; j++) {
      const attack = boss.attacksToResolve[j];

      for (let k = 0; k < socketIds.length; k++) {
        const player = players[socketIds[k]];

        if (player) {
          const hit = physics.checkHitPlayer(
            {
              x: attack.x, y: attack.y, width: attack.w, height: attack.h,
            },
            {
              x: player.x - (player.width / 2),
              y: player.y - (player.height / 2),
              width: player.width,
              height: player.height,
            },
          );

          if (hit) {
            player.currentHealth -= 10;
            updatePlayer(room, player);
          }
        }
      }

      removeAttack(room, attack);
      boss.attacksToResolve.splice(j, 1);
      j--;
    }
  }
};

module.exports = {
  hasBoss,
  getBoss,
  takeDamage,
  spawnBoss,
  updateBosses,
  updateBossAttacks,
  resolveBossAttacks,
  getAvailableChars,
  validateChar,
  getChar,
};
