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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DamageArea = function () {
  function DamageArea(dimensions, progress) {
    _classCallCheck(this, DamageArea);

    this.status = {
      opacity: 0.2 + 0.6 * progress
    };

    this.dimensions = {
      x: dimensions.x,
      y: dimensions.y,
      w: 0 + progress * dimensions.w,
      h: 0 + progress * dimensions.h
    };

    this.fullSize = {
      w: dimensions.w,
      h: dimensions.h
    };

    this.phrases = [{
      text: "Great Power",
      textOffset: 0,
      speed: 1
    }, {
      text: "Danger",
      textOffset: 0,
      speed: -2
    }, {
      text: "Stay Away",
      textOffset: 0,
      speed: 2
    }, {
      text: "Binding Agreement",
      textOffset: 0,
      speed: -1
    }];
  }

  _createClass(DamageArea, [{
    key: "growBox",
    value: function growBox(amount) {
      this.dimensions.w += amount;
      this.dimensions.h += amount;

      if (this.dimensions.w > this.fullSize.w) {
        this.dimensions.w = this.fullSize.w;
      }

      if (this.dimensions.h > this.fullSize.h) {
        this.dimensions.h = this.fullSize.h;
      }
    }
  }, {
    key: "update",
    value: function update(progress) {
      this.status.opacity = 0.2 + 0.4 * progress;
    }
  }]);

  return DamageArea;
}();

;
"use strict";

var bossImageStruct = {
  "dragon": document.querySelector("#dragonBoss")
};

var characterImageStruct = {};

var damageAreas = {};
var gems = [];

var lerp = function lerp(pos1, pos2, ratio) {
  var component1 = (1 - ratio) * pos1;
  var component2 = ratio * pos2;
  return component1 + component2;
};

var draw = function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Draw background
  ctx.drawImage(dungeonFloor, 0, 0, canvas.width, canvas.height);

  // Draw code
  var playerKeys = Object.keys(players);
  frameCounter++;

  var damageAreaKeys = Object.keys(damageAreas);
  for (var i = 0; i < damageAreaKeys.length; i++) {
    drawDamageArea(damageAreas[damageAreaKeys[i]]);
  }

  drawAndUpdateGems();

  for (var _i = 0; _i < playerKeys.length; _i++) {
    var player = players[playerKeys[_i]];

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

    if (!player.alive) {
      if (player.anim.row !== 20) {
        switchAnimation(player, 'death');
        player.direction = player.DIRECTIONS.up;
      }
    }

    if (characterImageStruct[player.name]) {
      if (player.attacking) {
        ctx.drawImage(characterImageStruct[player.name], player.attWidth * player.frame, player.anim.row * player.height + player.direction * player.attHeight, player.attWidth, player.attHeight, player.x - player.attWidth / 2, player.y - player.attHeight / 2, player.attWidth, player.attHeight);
      } else {
        ctx.drawImage(characterImageStruct[player.name], player.width * player.frame, player.height * (player.anim.row + player.direction), player.width, player.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
      }

      if (player.alive) {
        drawHealthBar(player.x, player.y, player.currentHealth, player.maxHealth);
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

    ctx.save();
    ctx.globalAlpha = boss.opacity;
    ctx.filter = "hue-rotate(" + boss.hueRotate + "deg)";
    ctx.drawImage(bossImageStruct[boss.sprite], boss.width * boss.frame, boss.height * (boss.anim.row + boss.direction), boss.width, boss.height, boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height);
    ctx.restore();

    if (!boss.alive) {
      boss.opacity -= 0.005;
      boss.opacity = Math.max(0, boss.opacity);
    } else {
      drawHealthBar(boss.x, boss.y, boss.currentHealth, boss.maxHealth);
    }
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

var drawDamageArea = function drawDamageArea(damageArea) {
  ctx.save();
  ctx.globalAlpha = damageArea.status.opacity;
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.font = "60px maras_eyeregular";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.strokeRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);

  ctx.beginPath();
  ctx.rect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.clip();

  var textHeight = 40;
  var currentY = 0;
  var currentPhraseIndex = 0;

  ctx.globalAlpha = ctx.globalAlpha + 0.2;

  while (currentY + textHeight < damageArea.dimensions.h + textHeight) {
    ctx.save();
    var currentPhrase = damageArea.phrases[currentPhraseIndex];

    var x = damageArea.dimensions.x + currentPhrase.textOffset;
    var y = damageArea.dimensions.y + currentY + textHeight / 2;

    var width = ctx.measureText(currentPhrase.text).width;

    if (currentPhrase.speed < 0) {
      ctx.translate(x + damageArea.dimensions.w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    ctx.fillText(currentPhrase.text, x, y);

    while (x + width < damageArea.dimensions.x + damageArea.dimensions.w) {
      x += width;
      ctx.fillText(currentPhrase.text, x, y);
    }

    currentPhrase.textOffset -= currentPhrase.speed;

    if (Math.abs(currentPhrase.textOffset) >= width) {
      currentPhrase.textOffset = 0;
    }

    currentPhraseIndex = (currentPhraseIndex + 1) % damageArea.phrases.length;
    currentY += textHeight;

    ctx.restore();
  }

  damageArea.growBox(4);

  ctx.restore();
};

var drawAndUpdateGems = function drawAndUpdateGems() {
  for (var i = 0; i < gems.length; i++) {
    var gem = gems[i];
    gem.x += gem.vector.x;
    gem.y += gem.vector.y;

    gem.ticks++;

    if (gem.ticks >= gem.activateMagnet) {
      var player = players[hash];
      var distX = gem.x - player.x;
      var distY = gem.y - player.y;
      var magnitude = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

      if (Math.abs(distX) < 40 && Math.abs(distY) < 40) {
        collectGem();
        gems.splice(i, 1);
        i--;
        continue;
      }

      gem.vector = {
        x: -distX / magnitude,
        y: -distY / magnitude
      };
    } else if (gem.ticks < gem.activateMagnet) {
      gem.vector = {
        x: gem.vector.x * 0.98,
        y: gem.vector.y * 0.98
      };
    }

    if (gem.x < 0) {
      gem.vector.x *= -1;
      gem.x = 0;
    } else if (gem.x > canvas.width - 25) {
      gem.vector.x *= -1;
      gem.x = canvas.width - 25;
    }

    if (gem.y < 0) {
      gem.vector.y *= -1;
      gem.y = 0;
    } else if (gem.y > canvas.height - 25) {
      gem.vector.y *= -1;
      gem.y = canvas.height - 25;
    }

    var gemSpriteX = 125 * (gem.sprite % 2);
    var gemSpriteY = 125 * Math.floor(gem.sprite / 2);

    ctx.drawImage(gemSprite, gemSpriteX, gemSpriteY, 125, 125, gem.x, gem.y, 25, 25);
  }
};
"use strict";

var canvas = void 0,
    ctx = void 0;
var socket = void 0,
    hash = void 0;
var animationFrame = void 0;

var players = {};
var boss = void 0;

var room = {};
var frameCounter = 0;

var dungeonFloor = void 0,
    gemSprite = void 0;

var healthContainer = void 0,
    healthBar = void 0;

var roomSetup = function roomSetup(roomJoined) {
  console.dir(roomJoined);
  room.roomJoined = roomJoined;

  // To Do: On room join code
  // Ask for player data and set up the game.
  socket.emit('requestCharacterData');
  console.dir("client roomJoined: " + room.roomJoined);
};

var keyDownEvent = function keyDownEvent(e) {
  var key = e.which;
  var player = players[hash];

  if (!player || !player.alive) {
    return;
  }

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

  if (!player || !player.alive) {
    return;
  }

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
  // renderGame(600, 600);

  // canvas = document.querySelector('#viewport');
  // ctx = canvas.getContext('2d');

  gemSprite = document.querySelector("#gemSprite");
  dungeonFloor = document.querySelector("#dungeonFloor");
  healthContainer = document.querySelector('#healthContainer');
  healthBar = document.querySelector('#healthBar');

  socket = io.connect();

  // Choose a character first
  socket.emit('getChars');

  socket.on('joined', roomSetup);
  socket.on('availableChars', handleChars);
  socket.on('moveToLobby', handleLobby);
  socket.on('setPlayer', setPlayer);
  socket.on('receiveAttack', receiveAttack);
  socket.on('updatePlayer', updatePlayer);
  socket.on('deletePlayer', deletePlayer);
  socket.on('disconnect', disconnect);

  socket.on('spawnBoss', spawnBoss);
  socket.on('updateBoss', updateBoss);
  socket.on('updateBossAttack', updateBossAttack);
  socket.on('removeBossAttack', removeBossAttack);
  socket.on('bossDeath', bossDeath);
  socket.on('dispenseGems', dispenseGems);

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

var renderGameInfo = function renderGameInfo(gameInfo) {
  ReactDOM.render(React.createElement(GameInfo, { info: gameInfo }), document.querySelector("#gameInfo"));
};

var GameInfo = function GameInfo(props) {

  var disabled = props.info.player.points === 0;

  return React.createElement(
    "div",
    null,
    React.createElement(
      "h1",
      null,
      "Game Info"
    ),
    React.createElement("hr", null),
    React.createElement(
      "h2",
      null,
      "Player Stats"
    ),
    props.info.player.alive && React.createElement(
      "div",
      null,
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Score (Gems): ",
          props.info.player.gems
        )
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Character Points: ",
          props.info.player.points
        )
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Max Health: ",
          props.info.player.maxHealth,
          " "
        ),
        React.createElement(
          "button",
          { id: "increaseHealth", "class": "levelUpButton", disabled: disabled, onClick: upgradeChar },
          "+10 HP"
        )
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Strength: ",
          props.info.player.strength,
          " "
        ),
        React.createElement(
          "button",
          { id: "increaseStrength", "class": "levelUpButton", disabled: disabled, onClick: upgradeChar },
          "+1 Strength"
        )
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Defense: ",
          props.info.player.defense,
          " "
        ),
        React.createElement(
          "button",
          { id: "increaseDefense", "class": "levelUpButton", disabled: disabled, onClick: upgradeChar },
          "+2 Defense"
        )
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "span",
          null,
          "Level: ",
          props.info.player.level,
          " (Exp: ",
          props.info.player.exp,
          " / ",
          props.info.player.nextLevel,
          ") "
        ),
        React.createElement("meter", {
          value: props.info.player.exp,
          min: props.info.player.prevLevel,
          max: props.info.player.nextLevel
        })
      )
    ),
    !props.info.player.alive && React.createElement(
      "button",
      { id: "respawnButton", onClick: respawnRequest },
      "Respawn"
    ),
    React.createElement("hr", null),
    React.createElement(
      "h2",
      null,
      "Boss Bounty"
    ),
    React.createElement(
      "p",
      null,
      React.createElement(
        "span",
        null,
        "Boss: ",
        props.info.boss.name
      )
    ),
    React.createElement(
      "p",
      null,
      React.createElement(
        "span",
        null,
        "Boss Level: ",
        props.info.boss.level
      )
    ),
    React.createElement(
      "p",
      null,
      React.createElement(
        "span",
        null,
        "Exp Reward: ",
        props.info.boss.exp
      )
    ),
    React.createElement(
      "p",
      null,
      React.createElement(
        "span",
        null,
        "Gem Reward: ",
        props.info.boss.gems
      )
    )
  );
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

// Handles join/create room button. Only allows users to join rooms only if they're in the lobby.
var joinRoom = function joinRoom(e, roomName, create) {
  console.log('join/create req recieved');
  console.log(room.roomJoined);
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

var renderLobby = function renderLobby() {
  ReactDOM.render(React.createElement(
    "div",
    { id: "roomContainer" },
    React.createElement(
      "form",
      { id: "createRoomForm" },
      React.createElement(
        "label",
        { "for": "createRoom" },
        "Create a Room"
      ),
      React.createElement("input", { id: "createRoomField", type: "text", name: "createRoom", maxlength: "4", size: "4" }),
      React.createElement("input", { type: "submit", value: "Create Room" })
    ),
    React.createElement(
      "form",
      { id: "joinRoomForm" },
      React.createElement(
        "label",
        { "for": "joinRoom" },
        "Join a Room"
      ),
      React.createElement("input", { id: "joinRoomField", type: "text", name: "joinRoom", maxlength: "4", size: "4" }),
      React.createElement("input", { type: "submit", value: "Join Room" })
    )
  ), document.querySelector("#main"));

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

  if (!player.alive) {

    if (player.anim.row !== 20) {
      switchAnimation(player, 'death');
    }

    player.moveUp = false;
    player.moveDown = false;
    player.moveLeft = false;
    player.moveRight = false;
    player.attacking = false;
    player.direction = player.DIRECTIONS.up;
    return;
  }

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

var handleLobby = function handleLobby(data) {
  room.roomJoined = 'lobby';
  renderLobby(data);
};

var aggregateGameInfo = function aggregateGameInfo() {
  var player = players[hash];
  var bossDetails = {};

  if (boss && boss.alive) {
    bossDetails = {
      name: boss.name,
      level: boss.level,
      exp: boss.exp,
      gems: boss.gems
    };
  } else {
    bossDetails = {
      name: "N/A",
      level: "N/A",
      exp: "N/A",
      gems: "N/A"
    };
  }

  var info = {
    player: {
      maxHealth: player.maxHealth,
      strength: player.strength,
      defense: player.defense,
      level: player.level,
      exp: player.exp,
      gems: player.gems,
      prevLevel: player.prevLevel,
      nextLevel: player.nextLevel,
      points: player.pointsToAllocate,
      alive: player.alive
    },
    boss: bossDetails
  };

  return info;
};

var setPlayer = function setPlayer(data) {

  hash = data.hash;
  players[hash] = data;
  players[hash].room = room.roomJoined;

  renderGame(600, 600, info);
  var info = aggregateGameInfo();
  renderGameInfo(info);

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }
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

  var flagToReRenderInfo = false;
  if (player.exp != data.exp || player.pointsToAllocate != data.pointsToAllocate || player.gems != data.gems || player.alive != data.alive) {
    flagToReRenderInfo = true;
  }

  // Player specific updates
  player.currentHealth = data.currentHealth;
  player.maxHealth = data.maxHealth;
  player.strength = data.strength;
  player.defense = data.defense;
  player.level = data.level;
  player.exp = data.exp;
  player.prevLevel = data.prevLevel;
  player.nextLevel = data.nextLevel;
  player.pointsToAllocate = data.pointsToAllocate;
  player.gems = data.gems;
  player.alive = data.alive;

  if (flagToReRenderInfo) {
    var info = aggregateGameInfo();
    renderGameInfo(info);
  }

  //Don't update movement or animations if the update is about this player
  if (hash === data.hash) {
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
  var info = aggregateGameInfo();
  renderGameInfo(info);
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

var updateBossAttack = function updateBossAttack(data) {
  var progress = data.progress / data.complete;
  if (!damageAreas[data.id]) {
    damageAreas[data.id] = new DamageArea({ x: data.x, y: data.y, w: data.w, h: data.h }, progress);
  } else {
    damageAreas[data.id].update(progress);
  }
};

var removeBossAttack = function removeBossAttack(data) {
  if (damageAreas[data.id]) {
    damageAreas[data.id] = undefined;
    delete damageAreas[data.id];
  }
};

var bossDeath = function bossDeath() {
  boss.anim = boss.ANIMS.death;
  boss.alive = false;
  damageAreas = {};
  var info = aggregateGameInfo();
  renderGameInfo(info);
};

var upgradeChar = function upgradeChar(e) {
  var id = e.target.getAttribute("id");
  switch (id) {
    case "increaseHealth":
      socket.emit('characterUpgrade', { upgrade: 'health' });
      break;
    case "increaseStrength":
      socket.emit('characterUpgrade', { upgrade: 'strength' });
      break;
    case "increaseDefense":
      socket.emit('characterUpgrade', { upgrade: 'defense' });
      break;
  }
};

var dispenseGems = function dispenseGems(data) {
  var gemCount = data.gems;

  for (var i = 0; i < gemCount; i++) {
    var randAngle = Math.random() * 360;
    var radian = randAngle * Math.PI / 180;
    var speed = 20 * Math.random() + 2;
    var vector = {
      x: Math.sin(radian) * speed,
      y: Math.cos(radian) * speed
    };
    var sprite = Math.floor(Math.random() * 4);

    var gem = {
      x: boss.x,
      y: boss.y,
      ticks: 0,
      activateMagnet: 200,
      radian: radian,
      speed: speed,
      vector: vector,
      sprite: sprite
    };

    gems.push(gem);
  }
};

var collectGem = function collectGem() {
  socket.emit('collectGem');
};

var respawnRequest = function respawnRequest() {
  socket.emit('respawnRequest');
};
