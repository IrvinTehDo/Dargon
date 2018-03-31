class Character {
  constructor(name, hash, x, y, stats) {
    this.ANIMS = {
      meditate: {
        row: 0,
        frameCount: 7,
        speed: 12,
        loop: true,
      },
      interact: {
        row: 4,
        frameCount: 8,
        speed: 5,
        loop: false,
      },
      walk: {
        row: 8,
        frameCount: 9,
        speed: 4,
        loop: true,
      },
      swipe: {
        row: 12,
        frameCount: 6,
        speed: 4,
        loop: false,
      },
      'fire-arrow': {
        row: 16,
        frameCount: 13,
        speed: 5,
        loop: false,
      },
      die: {
        row: 20,
        frameCount: 6,
        speed: 10,
        loop: false,
      },
      attack: {
        row: 21,
        frameCount: 6,
        speed: 4,
        loop: false,
      },
    };

    this.DIRECTIONS = {
      up: 0,
      left: 1,
      down: 2,
      right: 3,
    };

    this.currentHealth = stats.maxHealth;
    this.maxHealth = stats.maxHealth;
    this.strength = stats.strength;
    this.defense = stats.defense;
    this.level = 1;
    this.exp = 0;
    this.prevLevel = 0;
    this.nextLevel = 200;
    this.pointsToAllocate = 0;

    this.name = name;
    this.hash = hash;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.destX = x;
    this.destY = y;
    this.width = 64;
    this.height = 64;
    this.attRowOffsetY = 1344;
    this.normWidth = 64;
    this.normHeight = 64;
    this.attWidth = 192;
    this.attHeight = 192;
    this.ratio = 0;
    this.frame = 0;
    this.anim = this.ANIMS.meditate;
    this.direction = this.DIRECTIONS.up;
    this.moveUp = false;
    this.moveLeft = false;
    this.moveDown = false;
    this.moveRight = false;
    this.attacking = false;
    this.lastUpdate = new Date().getTime();
    this.room = 'lobby';
  }
}

module.exports = Character;
