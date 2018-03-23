// const bossHandler = require('./bossHandler.js');
const classes = require('./../classes');

const { Dragon } = classes;

const bosses = {};

const hasBoss = roomId => bosses[roomId] !== undefined;

const getBoss = roomId => bosses[roomId];

const spawnBoss = (roomId, callback) => {
  const randX = Math.floor(Math.random() * 200) + 96;
  const randY = Math.floor(Math.random() * 200) + 96;

  bosses[roomId] = new Dragon(
    { x: randX, y: randY },
    { strength: 10, defense: 10, health: 100 },
    roomId,
  );

  callback(getBoss(roomId));
};

module.exports = {
  hasBoss,
  getBoss,
  spawnBoss,
};
