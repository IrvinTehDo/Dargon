// Import custom physics libraries here
const collision = require('./collision.js');

// const classes = require('./../classes');

// const { Message } = classes;

// Setup interaction with main node server

const checkHitEnemy = (attack, enemy) => {
//  if (!target.sprite === 'dragon') {
//    return false;
//  }

  if (collision.AABB(attack, enemy)) {
    console.log('Hit enemy');
    return true;
  }

  return false;
};


module.exports = {
  checkHitEnemy,
};
