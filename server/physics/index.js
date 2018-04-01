// Import custom physics libraries here
const collision = require('./collision.js');

// const classes = require('./../classes');

// const { Message } = classes;

// Setup interaction with main node server

// If hits enemy, return true.
const checkHitEnemy = (attack, enemy) => {
  if (collision.AABB(attack, enemy)) {
    console.log('Hit enemy');
    return true;
  }

  return false;
};

const checkHitPlayer = (attack, player) => {
  if (collision.AABB(attack, player)) {
    return true;
  }

  return false;
};


module.exports = {
  checkHitEnemy,
  checkHitPlayer,
};
