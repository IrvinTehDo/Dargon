class Dragon {
  constructor(location, stats, roomId) {
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
    };

    this.DIRECTIONS = {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    };

    this.room = roomId;
    this.sprite = 'dragon';

    this.currentHealth = stats.health;
    this.maxHealth = stats.health;
    this.strength = stats.strength;
    this.defense = stats.defense;
    this.speed = stats.speed;
    this.maxIdleTicks = stats.speed * 60;

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
