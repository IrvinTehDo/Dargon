'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Character = function Character(hash) {
  var _this = this;

  _classCallCheck(this, Character);

  this.ANIMS = {
    meditate: {
      row: 0,
      frameCount: 7,
      speed: 12
    },
    interact: {
      row: 4,
      frameCount: 8,
      speed: 5
    },
    walk: {
      row: 8,
      frameCount: 9,
      speed: 4
    },
    swipe: {
      row: 12,
      frameCount: 6,
      speed: 4
    },
    'fire-arrow': {
      row: 16,
      frameCount: 13,
      speed: 5
    },
    die: {
      row: 20,
      frameCount: 6,
      speed: 10
    },
    attack: {
      row: 21,
      frameCount: 6,
      speed: 4
    }
  };

  this.DIRECTIONS = {
    up: 0,
    left: 1,
    down: 2,
    right: 3
  };

  this.setImage = function (image) {
    _this.image = image;
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
  this.anim = this.ANIMS.meditate;
  this.direction = this.DIRECTIONS.up;
  this.moveUp = false;
  this.moveLeft = false;
  this.moveDown = false;
  this.moveRight = false;
  this.attacking = false;
  this.lastUpdate = new Date().getTime();
};
"use strict";

var lerp = function lerp(pos1, pos2, ratio) {
  var component1 = (1 - ratio) * pos1;
  var component2 = ratio * pos2;
  return component1 + component2;
};

var draw = function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw code
  var playerKeys = Object.keys(players);
  frameCounter++;

  for (var i = 0; i < playerKeys.length; i++) {
    var player = players[playerKeys[i]];

    if (player.ratio < 1) {
      player.ratio += 0.05;
    }

    ctx.save();

    player.x = lerp(player.prevX, player.destX, player.ratio);
    player.y = lerp(player.prevY, player.destY, player.ratio);

    if (frameCounter % player.anim.speed === 0) {
      if (player.anim.loop === true) {
        player.frame = (player.frame + 1) % player.anim.frameCount;
      } else if (player.frame < player.anim.frameCount - 2) {
        player.frame++;
      } else if (player.attacking) {
        player.attacking = false;
      }
    }

    if (defaultChar) {
      if (player.attacking) {
        ctx.drawImage(defaultChar, player.attWidth * player.frame, player.anim.row * player.height + player.direction * player.attHeight, player.attWidth, player.attHeight, player.x - player.attWidth / 2, player.y - player.attHeight / 2, player.attWidth, player.attHeight);
      } else {
        ctx.drawImage(defaultChar, player.width * player.frame, player.height * (player.anim.row + player.direction), player.width, player.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
      }
    }

    ctx.restore();
  }
};

var switchAnimation = function switchAnimation(player, animation) {
  if (player.anim.row != player.ANIMS[animation].row) {
    player.frame = 0;
    player.anim = player.ANIMS[animation];
  }
};
'use strict';

var canvas = void 0,
    ctx = void 0;
var socket = void 0,
    hash = void 0;
var animationFrame = void 0;
var players = {};
var room = {};
var frameCounter = 0;

var defaultChar = void 0;

var roomSetup = function roomSetup(roomJoined) {
  room.roomJoined = roomJoined;
  // To Do: On room join code
  console.dir(roomJoined);
};

// Handles join/create room button. Only allows users to join rooms only if they're in the lobby.
var joinRoom = function joinRoom(e, roomName, create) {
  if (room.roomJoined !== 'lobby') {
    e.preventDefault();
    return false;
  }

  if (create) {
    socket.emit('createRoom', roomName);
  } else {
    socket.emit('joinRoom', roomName);
  }

  e.preventDefault();
  return false;
};

var keyDownEvent = function keyDownEvent(e) {
  var key = e.which;
  var player = players[hash];

  if (key === 87 || key === 38) {
    player.moveUp = true;
  } else if (key === 83 || key === 40) {
    player.moveDown = true;
  } else if (key === 65 || key === 37) {
    player.moveLeft = true;
  } else if (key === 68 || key === 39) {
    player.moveRight = true;
  } else if (key === 32) {
    sendAttack();
  }
};

var keyUpEvent = function keyUpEvent(e) {
  var key = e.which;
  var player = players[hash];

  if (key === 87 || key === 38) {
    player.moveUp = false;
  } else if (key === 83 || key === 40) {
    player.moveDown = false;
  } else if (key === 65 || key === 37) {
    player.moveLeft = false;
  } else if (key === 68 || key === 39) {
    player.moveRight = false;
  }
};

var init = function init() {
  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');

  defaultChar = document.querySelector('#defaultChar');

  socket = io.connect();
  socket.on('joined', roomSetup);
  socket.on('setPlayer', setPlayer);
  socket.on('receiveAttack', receiveAttack);
  socket.on('updatePlayer', updatePlayer);
  socket.on('deletePlayer', deletePlayer);

  var createRoomForm = document.querySelector('#createRoomForm');
  var sendCreateReq = function sendCreateReq(e) {
    return joinRoom(e, createRoomForm.querySelector('#createRoomField').value, true);
  };
  createRoomForm.addEventListener('submit', sendCreateReq);

  var joinRoomForm = document.querySelector('#joinRoomForm');
  var sendJoinReq = function sendJoinReq(e) {
    return joinRoom(e, joinRoomForm.querySelector('#joinRoomField').value, false);
  };
  joinRoomForm.addEventListener('submit', sendJoinReq);

  document.body.addEventListener('keydown', keyDownEvent);
  document.body.addEventListener('keyup', keyUpEvent);
};

window.onload = init;
'use strict';

var update = function update() {
  // Update code
  updateLocalPosition();
  draw();

  animationFrame = requestAnimationFrame(update);
};

var updateLocalPosition = function updateLocalPosition() {
  var player = players[hash];

  player.prevX = player.x;
  player.prevY = player.y;

  if (player.moveLeft && player.x >= 2) {
    player.destX -= 2;
    player.direction = player.DIRECTIONS.left;
  }

  if (player.moveRight && player.x <= canvas.width - player.width - 2) {
    player.destX += 2;
    player.direction = player.DIRECTIONS.right;
  }

  if (player.moveUp && player.y >= 2) {
    player.destY -= 2;
    player.direction = player.DIRECTIONS.up;
  }

  if (player.moveDown && player.y <= canvas.height - player.height - 2) {
    player.destY += 2;
    player.direction = player.DIRECTIONS.down;
  }

  if (!player.attacking) {
    if (player.moveUp || player.moveDown || player.moveLeft || player.moveRight) {
      switchAnimation(player, 'walk');
    } else {
      switchAnimation(player, 'meditate');
    }
  }

  player.ratio = 0.05;
  socket.emit('playerMovement', player);
};

var setPlayer = function setPlayer(data) {
  hash = data.hash;
  players[hash] = data;
  animationFrame = requestAnimationFrame(update);

  console.log(players[hash]);
};

var sendAttack = function sendAttack() {
  var player = players[hash];

  var attack = {
    hash: hash,
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height
  };

  socket.emit('sendAttack', attack);
};

var receiveAttack = function receiveAttack(data) {
  if (players[data.hash]) {
    players[data.hash].attacking = true;
    switchAnimation(players[data.hash], 'attack');
  }
};

var updatePlayer = function updatePlayer(data) {
  if (!players[data.hash]) {
    players[data.hash] = new Character(data.hash);
  }

  if (players[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  var player = players[data.hash];

  if (hash === data.hash) {
    // Player specific updates
    return;
  }

  player.prevX = data.prevX;
  player.prevY = data.prevY;
  player.destX = data.destX;
  player.destY = data.destY;
  player.anim = data.anim;
  player.direction = data.direction;
  player.ratio = data.ratio;
  player.moveUp = data.moveUp;
  player.moveDown = data.moveDown;
  player.moveLeft = data.moveLeft;
  player.moveRight = data.moveRight;
  player.lastUpdate = data.lastUpdate;
};

var deletePlayer = function deletePlayer(data) {
  if (players[data.hash]) {
    delete players[data.hash];
  }
};
