// Import custom physics libraries here
const collision = require('./collision.js');

// If hits enemy, return true.
const checkHitEnemy = (attack, enemy) => {
  if (collision.AABB(attack, enemy)) {
    return true;
  }

  return false;
};

// Check to see if the attack hits the player
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
