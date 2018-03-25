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
  this.room = 'lobby';
};
"use strict";

var bossImageStruct = {
  "dragon": document.querySelector("#dragonBoss")
};

var characterImageStruct = {};

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
      } else if (player.frame < player.anim.frameCount - 1) {
        player.frame++;
      } else if (player.attacking) {
        player.attacking = false;
        switchAnimation(player, "meditate");
      }
    }

    if (characterImageStruct[player.name]) {
      if (player.attacking) {
        ctx.drawImage(characterImageStruct[player.name], player.attWidth * player.frame, player.anim.row * player.height + player.direction * player.attHeight, player.attWidth, player.attHeight, player.x - player.attWidth / 2, player.y - player.attHeight / 2, player.attWidth, player.attHeight);
      } else {
        ctx.drawImage(characterImageStruct[player.name], player.width * player.frame, player.height * (player.anim.row + player.direction), player.width, player.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
      }
    }

    ctx.restore();
  }

  //Draw boss
  if (boss) {

    boss.x = lerp(boss.prevX, boss.destX, boss.ratio);
    boss.y = lerp(boss.prevY, boss.destY, boss.ratio);

    if (frameCounter % boss.anim.speed === 0) {
      if (boss.anim.loop === true) {
        boss.frame = (boss.frame + 1) % boss.anim.frameCount;
      } else if (boss.frame < boss.anim.frameCount - 2) {
        boss.frame++;
      }
    }

    ctx.drawImage(bossImageStruct[boss.sprite], boss.width * boss.frame, boss.height * (boss.anim.row + boss.direction), boss.width, boss.height, boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height);

    drawHealthBar(boss.x, boss.y, boss.currentHealth, boss.maxHealth);
  }
};

var switchAnimation = function switchAnimation(player, animation) {
  if (player.anim.row != player.ANIMS[animation].row) {
    player.frame = 0;
    player.anim = player.ANIMS[animation];
  }
};

var drawHealthBar = function drawHealthBar(x, y, health, maxHealth) {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.drawImage(healthContainer, x - healthContainer.width / 2, y + healthContainer.height);
  ctx.drawImage(healthBar, 0, 0, healthBar.width * (health / maxHealth), healthBar.height, x - healthBar.width / 2, y + healthContainer.height + 8, healthBar.width * (health / maxHealth), healthBar.height);
  ctx.restore();
};
'use strict';

var canvas = void 0,
    ctx = void 0;
var socket = void 0,
    hash = void 0;
var animationFrame = void 0;

var players = {};
var boss = void 0;

var room = {};
var frameCounter = 0;

var defaultChar = void 0;

var healthContainer = void 0,
    healthBar = void 0;

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
  } else if (key === 32 && !player.attacking) {
    player.attacking = true;
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

  //renderGame(600, 600);

  //canvas = document.querySelector('#viewport');
  //ctx = canvas.getContext('2d');

  healthContainer = document.querySelector("#healthContainer");
  healthBar = document.querySelector("#healthBar");

  socket = io.connect();

  //Choose a character first
  socket.emit('getChars');

  socket.on('joined', roomSetup);
  socket.on('availableChars', handleChars);
  socket.on('setPlayer', setPlayer);
  socket.on('receiveAttack', receiveAttack);
  socket.on('updatePlayer', updatePlayer);
  socket.on('deletePlayer', deletePlayer);
  socket.on('disconnect', disconnect);

  socket.on('spawnBoss', spawnBoss);
  socket.on('updateBoss', updateBoss);

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
"use strict";

//Construct the main window (using a given width and height for the canvas)
var GameWindow = function GameWindow(props) {
  return React.createElement(
    "div",
    null,
    React.createElement("iframe", { width: "560", height: "315",
      src: "http://www.youtube.com/embed/videoseries?list=PLbzURmDMdJdPlsSgLqqb3IwnY5A0jWK_q",
      frameBorder: "0", allow: "autoplay; encrypted-media", id: "videoFrame" }),
    React.createElement("canvas", { id: "viewport", width: props.width, height: props.height })
  );
};

//Make a call to render the game window above, and pass in the desired canvas dimensions
var renderGame = function renderGame(width, height) {
  ReactDOM.render(React.createElement(GameWindow, { width: width, height: height }), document.querySelector("#main"));

  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');
};

var CharSelect = function CharSelect(props) {

  //Map the characters object into an array
  var charactersArray = Object.keys(props.characters).map(function (character) {
    return props.characters[character];
  });

  //Return jsx to inform that player that the characters are still loading
  if (charactersArray.length === 0) {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "h2",
        null,
        "Loading..."
      )
    );
  };

  //Construct panels for each returned character (map function creates a new array)
  var charList = charactersArray.map(function (character) {
    //Insert values using curly braces
    return React.createElement(
      "div",
      { "class": "charPreview" },
      React.createElement(
        "h2",
        null,
        character.name
      ),
      React.createElement(
        "div",
        { "class": "crop-image" },
        React.createElement("img", { src: character.imageFile, alt: character.name + " sprite" })
      ),
      React.createElement("hr", null),
      React.createElement(
        "div",
        null,
        React.createElement(
          "h3",
          null,
          "Stats"
        ),
        React.createElement(
          "p",
          null,
          "Strength: ",
          character.strength
        ),
        React.createElement(
          "p",
          null,
          "Defense: ",
          character.defense
        ),
        React.createElement(
          "p",
          null,
          "Speed: ",
          character.speed
        ),
        React.createElement(
          "p",
          null,
          "Health: ",
          character.maxHealth
        )
      ),
      React.createElement("hr", null),
      React.createElement(
        "button",
        { onClick: chooseCharacter, selectid: character.name },
        "Select"
      )
    );
  });

  //Return all of the panels (the passed in array auto formats)
  return React.createElement(
    "div",
    null,
    React.createElement(
      "h1",
      null,
      "Select Your Character"
    ),
    charList
  );
};

var renderCharacterSelect = function renderCharacterSelect(chars) {
  ReactDOM.render(React.createElement(CharSelect, { characters: chars }), document.querySelector("#main"));
};
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
  } else {
    switchAnimation(player, 'attack');
  }

  player.ratio = 0.05;
  socket.emit('playerMovement', player);
};

var handleChars = function handleChars(data) {
  //Load character files into memory for later usage
  var charKeys = Object.keys(data);

  var _loop = function _loop(i) {
    var character = data[charKeys[i]];

    var charImage = new Image();

    charImage.onload = function () {
      characterImageStruct[charKeys[i]] = charImage;
    };

    charImage.src = character.imageFile;
  };

  for (var i = 0; i < charKeys.length; i++) {
    _loop(i);
  }

  renderCharacterSelect(data);
};

var chooseCharacter = function chooseCharacter(e) {
  socket.emit('chooseCharacter', { id: e.target.getAttribute('selectid') });
};

var setPlayer = function setPlayer(data) {

  renderGame(600, 600);

  hash = data.hash;
  players[hash] = data;

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }

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

  socket.emit('sendAttack', attack, player.room);
};

var receiveAttack = function receiveAttack(data) {
  if (players[data.hash]) {
    players[data.hash].attacking = true;
    switchAnimation(players[data.hash], 'attack');
  }
};

var updatePlayer = function updatePlayer(data) {
  if (!players[data.hash]) {
    players[data.hash] = data;
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
  player.attacking = data.attacking;
  player.lastUpdate = data.lastUpdate;

  if (player.attacking) {
    switchAnimation(player, "attack");
  }
};

var deletePlayer = function deletePlayer(data) {
  if (players[data.hash]) {
    delete players[data.hash];
  }
};

var disconnect = function disconnect() {
  if (hash) {
    cancelAnimationFrame(animationFrame);
    delete players[hash];
    animationFrame = undefined;
  }
};

var spawnBoss = function spawnBoss(data) {
  boss = data;
};

var updateBoss = function updateBoss(data) {
  if (!boss) {
    return;
  }

  var keys = Object.keys(data);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    boss[key] = data[key];
  }
};
