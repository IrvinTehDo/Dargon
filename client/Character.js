class Character {
	constructor(hash) {
		
		this.ANIMS = {
			"meditate": {
				row: 0,
				frameCount: 7,
				speed: 12,
			},
			"interact": {
				row: 4,
				frameCount: 8,
				speed: 5,
			},
			"walk": {
				row: 8,
				frameCount: 9,
				speed: 4,
			},
			"swipe": {
				row: 12,
				frameCount: 6,
				speed: 4,
			},
			"fire-arrow": {
				row: 16,
				frameCount: 13,
				speed: 5,
			},
			"die": {
				row: 20,
				frameCount: 6,
				speed: 10,
			},
			"attack": {
				row: 21,
				frameCount: 6,
				speed: 4,
			}
		};

		this.DIRECTIONS = {
			"up": 0,
			"left": 1,
			"down": 2,
			"right": 3,
		};
		
		this.setImage = (image) => {
			this.image = image;
		};
		
		
		this.hash = hash;
		this.image = null;
		this.x = 0;
		this.y = 0;
		this.prevX = 0;
		this.prevY = 0;
		this.destX = 0;
		this.destY = 0;
		this.width = 64;
		this.height = 64;
		this.attRowOffsetY = 1344;
		this.normWidth = 64;
		this.normHeight = 64;
		this.attWidth = 192;
		this.attHeight = 192;
		this.ratio = 0;
		this.frame = 0;
		this.anim = this.ANIMS["meditate"];
		this.direction = this.DIRECTIONS["up"];
		this.moveUp = false;
		this.moveLeft = false;
		this.moveDown = false;
		this.moveRight = false;
		this.lastUpdate = new Date().getTime();
	};
};