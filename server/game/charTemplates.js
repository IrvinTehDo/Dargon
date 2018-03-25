const imgDir = '/assets/img/char/';
const templates = {
  Rean: {
    name: 'Rean',
    imageFile: `${imgDir}rean.png`,
    // Curently unused- when characters' stats matter- implement these here
    strength: 2,
    defense: 3,
    speed: 2,
    maxHealth: 50,
  },
  Alice: {
    name: 'Alice',
    imageFile: `${imgDir}alice.png`,
    strength: 3,
    defense: 1,
    speed: 1,
    maxHealth: 30,
  },
};

module.exports = templates;
