// const bossHandler = require('./bossHandler.js');
const classes = require('./../classes');

const { Dragon } = classes;

const bosses = {};

const hasBoss = roomId => bosses[roomId] !== undefined;

const getBoss = roomId => bosses[roomId].being;

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

const updateBosses = (callback) => {
  const bossKeys = Object.keys(bosses);

  for (let i = 0; i < bossKeys.length; i++) {
    const bossObj = bosses[bossKeys[i]];
    const boss = bossObj.being;

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

module.exports = {
  hasBoss,
  getBoss,
  spawnBoss,
  updateBosses,
};
