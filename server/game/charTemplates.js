const imgDir = '/assets/img/char/';
// Define character templates (used for the character selection process)
const templates = {
  // All characters have a name, specific image file, and starting strength, defense, and max health
  Rean: {
    name: 'Rean',
    imageFile: `${imgDir}rean.png`,
    strength: 2,
    defense: 3,
    maxHealth: 50,
  },
  Alice: {
    name: 'Alice',
    imageFile: `${imgDir}alice.png`,
    strength: 3,
    defense: 1,
    maxHealth: 30,
  },
  George: {
    name: 'George',
    imageFile: `${imgDir}george.png`,
    strength: 0,
    defense: 0,
    maxHealth: 300,
  },
  Elena: {
    name: 'Elena',
    imageFile: `${imgDir}elena.png`,
    strength: 0,
    defense: 5,
    maxHealth: 100,
  },
  Spike: {
    name: 'Spike',
    imageFile: `${imgDir}spike.png`,
    strength: 2,
    defense: 2,
    maxHealth: 75,
  },
  Sarah: {
    name: 'Sarah',
    imageFile: `${imgDir}sarah.png`,
    strength: 5,
    defense: -1,
    maxHealth: 20,
  },
  Skelly: {
    name: 'Skelly',
    imageFile: `${imgDir}skelly.png`,
    strength: 8,
    defense: -4,
    maxHealth: 10,
  },
  Julia: {
    name: 'Julia',
    imageFile: `${imgDir}julia.png`,
    strength: -2,
    defense: 7,
    maxHealth: 150,
  },
};

module.exports = templates;
