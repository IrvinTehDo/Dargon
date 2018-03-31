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
const spawnQueue = [];

const hasBoss = roomId => bosses[roomId] !== undefined;

const getBoss = roomId => bosses[roomId].being;

const getSpawnQueue = () => spawnQueue;
const spliceSpawnQueue = i => spawnQueue.splice(i, 1);

let prevAttackTime = new Date().getTime();

const calcAggregateLevel = (players, roomHashes) => {
  let level = 0;

  const playerHashes = Object.keys(roomHashes);
  for (let i = 0; i < playerHashes.length; i++) {
    const player = players[playerHashes[i]];
    level += player.level;
  }

  return level;
};

const bossDeath = (roomId, players, playerHashes, io) => {
  const boss = bosses[roomId].being;
  const { exp } = boss;
  const { gems } = boss;
  const hashes = Object.keys(playerHashes);

  for (let i = 0; i < hashes.length; i++) {
    const player = players[hashes[i]];
    player.exp += exp;
    player.gemsToCollect = gems;

    if (player.exp > player.nextLevel) {
      player.level++;
      player.pointsToAllocate += 2;
      player.prevLevel = player.nextLevel;
      player.nextLevel = Math.floor(player.nextLevel * 2.2);
    }

    io.sockets.in(roomId).emit('updatePlayer', player);
    io.sockets.in(roomId).emit('bossDeath');
    io.sockets.in(roomId).emit('dispenseGems', { gems: boss.gems });
  }

  delete bosses[roomId];

  setTimeout(() => {
    spawnQueue.push(roomId);
    console.log(spawnQueue);
  }, 5000);
};

const takeDamage = (roomId, damage, players, playerHashes, io) => {
  if (!bosses[roomId]) {
    return;
  }

  bosses[roomId].being.currentHealth -= damage;
  console.log(`${bosses[roomId].being.sprite} takes ${damage} damage. Current health: ${bosses[roomId].being.currentHealth}`);

  io.sockets.in(roomId).emit('updateBoss', { currentHealth: bosses[roomId].being.currentHealth });

  // SUPER DUPER TEMPORARY, resets health to 100 if boss hp is at 0.
  if (bosses[roomId].being.currentHealth <= 0) {
    // bosses[roomId].being.currentHealth = 100;
    // console.log('resetting health to 100');
    bossDeath(roomId, players, playerHashes, io);
  }
};

const generateBossStats = (lvl) => {
  const level = lvl;
  return {
    level,
    health: level * 10,
    strength: level * 2,
    defense: level,
    speed: Math.min(level / 2, 10),
    attackSpeed: Math.max(1, 6 - (level / 10)),
  };
};

const spawnBoss = (roomId, level, callback) => {
  const randX = Math.floor(Math.random() * 200) + 96;
  const randY = Math.floor(Math.random() * 200) + 96;

  bosses[roomId] = {
    being: new Dragon(
      { x: randX, y: randY },
      generateBossStats(level),
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
    x: Math.floor(Math.random() * 400) + 96,
    y: Math.floor(Math.random() * 400) + 96,
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

const calcDamage = (attacker, receiver) => {
  const damage = attacker.strength - receiver.defense;
  return Math.max(damage, 1);
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
            const damage = calcDamage(boss.being, player);
            player.currentHealth -= damage;
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

const upgradePlayer = (p, upgrade, callback) => {
  const player = p;
  switch (upgrade) {
    case 'health':
      player.currentHealth += 10;
      player.maxHealth += 10;
      break;
    case 'strength':
      player.strength += 1;
      break;
    case 'defense':
      player.defense += 2;
      break;
    default:
      player.currentHealth += 10;
      player.maxHealth += 10;
      break;
  }

  callback(player);
};

module.exports = {
  hasBoss,
  getBoss,
  getSpawnQueue,
  spliceSpawnQueue,
  calcDamage,
  calcAggregateLevel,
  takeDamage,
  spawnBoss,
  updateBosses,
  updateBossAttacks,
  resolveBossAttacks,
  getAvailableChars,
  validateChar,
  getChar,
  upgradePlayer,
};
