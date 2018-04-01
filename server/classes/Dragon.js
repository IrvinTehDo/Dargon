class Dragon {
  // Build a dragon boss given a starting location, starting stats, and a room to bind to
  constructor(location, stats, roomId) {
    // Define animations for the dragon
    this.ANIMS = {
      idle: {
        row: 4,
        frameCount: 2,
        speed: 50,
        loop: true,
      },
      walk: {
        row: 0,
        frameCount: 4,
        speed: 10,
        loop: true,
      },
      crawl: {
        row: 4,
        frameCount: 4,
        speed: 6,
        loop: true,
      },
      death: {
        row: 4,
        frameCount: 1,
        speed: 200,
        loop: true,
      },
    };

    this.DIRECTIONS = {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    };

    // Define starting state for the dragon based on provided stats
    this.room = roomId;
    this.sprite = 'dragon';
    this.name = 'Algor';

    this.currentHealth = stats.health;
    this.maxHealth = stats.health;
    this.strength = stats.strength;
    this.defense = stats.defense;
    this.speed = stats.speed;
    this.maxIdleTicks = stats.speed * 60;
    this.attackFreq = stats.attackSpeed * 25;

    this.level = stats.level;
    this.exp = (stats.health * 2)
    + (stats.strength * 30)
    + (stats.defense * 20)
    + (stats.speed * 20);
    this.gems = stats.health;

    this.opacity = 1;
    this.hueRotate = Math.floor(Math.random() * 360);
    this.alive = true;

    this.x = location.x;
    this.y = location.y;
    this.prevX = location.x;
    this.prevY = location.y;
    this.destX = location.x;
    this.destY = location.y;
    this.width = 96;
    this.height = 96;
    this.ratio = 0;
    this.frame = 0;
    this.anim = this.ANIMS.idle;
    this.direction = this.DIRECTIONS.down;

    this.lastUpdate = new Date().getTime();
  }
}

module.exports = Dragon;
