"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//Class for damage areas where the player can be hurt if they stand within it for too long
var DamageArea = function () {
  function DamageArea(dimensions, progress) {
    _classCallCheck(this, DamageArea);

    //Set the general status
    this.status = {
      opacity: 0.2 + 0.6 * progress
    };

    //Define the boxes dimensions (start as a 0 pixel box)
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

    //Define some phrases that will show up in arcane script
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


    //Grow the box by a given amount (constrain to the max box size)
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

    //Update the boxes opacity

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

//Grab the boss spritesheets
var bossImageStruct = {
  "dragon": document.querySelector("#dragonBoss")
};

var characterImageStruct = {};

var damageAreas = {};
var gems = [];

//Function that lerps between two given points using the provided ratio
var lerp = function lerp(pos1, pos2, ratio) {
  var component1 = (1 - ratio) * pos1;
  var component2 = ratio * pos2;
  return component1 + component2;
};

//Draw the scene to the canvas
var draw = function draw() {
  //Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Draw background
  ctx.drawImage(dungeonFloor, 0, 0, canvas.width, canvas.height);

  // Draw code
  var playerKeys = Object.keys(players);
  frameCounter++;

  //Draw all of the damage areas
  var damageAreaKeys = Object.keys(damageAreas);
  for (var i = 0; i < damageAreaKeys.length; i++) {
    drawDamageArea(damageAreas[damageAreaKeys[i]]);
  }

  //Draw all of the gems
  drawAndUpdateGems();

  //Iterate over the players in the room
  for (var _i = 0; _i < playerKeys.length; _i++) {
    var player = players[playerKeys[_i]];

    //Update the position ratio for lerping
    if (player.ratio < 1) {
      player.ratio += 0.05;
    }

    ctx.save();

    //Calculate the new player position
    player.x = lerp(player.prevX, player.destX, player.ratio);
    player.y = lerp(player.prevY, player.destY, player.ratio);

    //If it's time to advance the current animation's frame
    if (frameCounter % player.anim.speed === 0) {
      //If it's looping, wrap the frame, otherwise stop at the last frame
      if (player.anim.loop === true) {
        player.frame = (player.frame + 1) % player.anim.frameCount;
      } else if (player.frame < player.anim.frameCount - 1) {
        player.frame++;
      } else if (player.attacking) {
        //if the player was attacking, reset them
        player.attacking = false;
        switchAnimation(player, "meditate");
      }
    }

    //If the player is dead,
    if (!player.alive) {
      //Switch the animation to 'death'
      if (player.anim.row !== 20) {
        switchAnimation(player, 'death');
        player.direction = player.DIRECTIONS.up;
      }
    }

    //If the player's image has loaded
    if (characterImageStruct[player.name]) {
      //If the player is attacking draw them using their attack dimensions
      if (player.attacking) {
        ctx.drawImage(characterImageStruct[player.name], player.attWidth * player.frame, player.anim.row * player.height + player.direction * player.attHeight, player.attWidth, player.attHeight, player.x - player.attWidth / 2, player.y - player.attHeight / 2, player.attWidth, player.attHeight);
        //If the player isn't attacking draw them using their normal dimensions
      } else {
        ctx.drawImage(characterImageStruct[player.name], player.width * player.frame, player.height * (player.anim.row + player.direction), player.width, player.height, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
      }

      //If the player is alive, draw their health bar
      if (player.alive) {
        drawHealthBar(player.x, player.y, player.currentHealth, player.maxHealth);
      }
    }

    ctx.restore();
  }

  //Draw the boss
  if (boss) {

    //Calculate the boss's new position
    boss.x = lerp(boss.prevX, boss.destX, boss.ratio);
    boss.y = lerp(boss.prevY, boss.destY, boss.ratio);

    //If the boss needs to advance it's frame, do so
    if (frameCounter % boss.anim.speed === 0) {
      if (boss.anim.loop === true) {
        boss.frame = (boss.frame + 1) % boss.anim.frameCount;
      } else if (boss.frame < boss.anim.frameCount - 2) {
        boss.frame++;
      }
    }

    //Alter the bosses color and draw it
    ctx.save();
    ctx.globalAlpha = boss.opacity;
    ctx.filter = "hue-rotate(" + boss.hueRotate + "deg)";
    ctx.drawImage(bossImageStruct[boss.sprite], boss.width * boss.frame, boss.height * (boss.anim.row + boss.direction), boss.width, boss.height, boss.x - boss.width / 2, boss.y - boss.height / 2, boss.width, boss.height);
    ctx.restore();

    //If the boss is dead, fade it out over time, otherwise draw the health bar
    if (!boss.alive) {
      boss.opacity -= 0.005;
      boss.opacity = Math.max(0, boss.opacity);
    } else {
      drawHealthBar(boss.x, boss.y, boss.currentHealth, boss.maxHealth);
    }
  }
};

//Switches a player's animation to the given animation
var switchAnimation = function switchAnimation(player, animation) {
  //Only switch if the player's current animation doesn't match
  if (player.anim.row != player.ANIMS[animation].row) {
    //Reset the player's frame and switch the animation
    player.frame = 0;
    player.anim = player.ANIMS[animation];
  }
};

//Draw the a health bar at the given location
var drawHealthBar = function drawHealthBar(x, y, health, maxHealth) {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.drawImage(healthContainer, x - healthContainer.width / 2, y + healthContainer.height);
  //Draw the green part of the health bar as a ratio of current health to max health
  ctx.drawImage(healthBar, 0, 0, healthBar.width * (health / maxHealth), healthBar.height, x - healthBar.width / 2, y + healthContainer.height + 8, healthBar.width * (health / maxHealth), healthBar.height);
  ctx.restore();
};

//Draw a damage area
var drawDamageArea = function drawDamageArea(damageArea) {
  //Configure the canvas and draw the outline of the damage area
  ctx.save();
  ctx.globalAlpha = damageArea.status.opacity;
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.font = "60px maras_eyeregular";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.strokeRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);

  //Create a canvas clip that will stop the draw call from exceeding the bounds of the box
  ctx.beginPath();
  ctx.rect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.clip();

  var textHeight = 40;
  var currentY = 0;
  var currentPhraseIndex = 0;

  ctx.globalAlpha = ctx.globalAlpha + 0.2;

  //Completely fill the box with arcane script
  while (currentY + textHeight < damageArea.dimensions.h + textHeight) {
    ctx.save();
    var currentPhrase = damageArea.phrases[currentPhraseIndex];

    var x = damageArea.dimensions.x + currentPhrase.textOffset;
    var y = damageArea.dimensions.y + currentY + textHeight / 2;

    var width = ctx.measureText(currentPhrase.text).width;

    //Reverse the text if the speed is negative
    if (currentPhrase.speed < 0) {
      ctx.translate(x + damageArea.dimensions.w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    ctx.fillText(currentPhrase.text, x, y);

    //Repeate the phrase until the edge of the box is met
    while (x + width < damageArea.dimensions.x + damageArea.dimensions.w) {
      x += width;
      ctx.fillText(currentPhrase.text, x, y);
    }

    currentPhrase.textOffset -= currentPhrase.speed;

    if (Math.abs(currentPhrase.textOffset) >= width) {
      currentPhrase.textOffset = 0;
    }

    //Move to the next phrase
    currentPhraseIndex = (currentPhraseIndex + 1) % damageArea.phrases.length;
    currentY += textHeight;

    ctx.restore();
  }

  //Grow the box a little bit (until it reaches full size)
  damageArea.growBox(4);

  ctx.restore();
};

//Draw and update the gems
var drawAndUpdateGems = function drawAndUpdateGems() {
  //Iterate over the gems
  for (var i = 0; i < gems.length; i++) {
    var gem = gems[i];

    //Update the gem's position
    gem.x += gem.vector.x;
    gem.y += gem.vector.y;

    gem.ticks++;

    //If enough time has passed, activate the gem's "magnet" feature
    if (gem.ticks >= gem.activateMagnet) {

      //Move towards the player
      var player = players[hash];
      var distX = gem.x - player.x;
      var distY = gem.y - player.y;
      var magnitude = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));

      //If within range, have the player collect the gem
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
      //Slow the gem down
      gem.vector = {
        x: gem.vector.x * 0.98,
        y: gem.vector.y * 0.98
      };
    }

    //Keep the gem within the bounds of the canvas
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

    //Draw the gem (4 gems on the spritesheet)
    var gemSpriteX = 125 * (gem.sprite % 2);
    var gemSpriteY = 125 * Math.floor(gem.sprite / 2);

    ctx.drawImage(gemSprite, gemSpriteX, gemSpriteY, 125, 125, gem.x, gem.y, 25, 25);
  }
};
'use strict';

//Define useful variables for all files
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

// Sets up the client game room they're about to join.
var roomSetup = function roomSetup(roomJoined) {
  console.dir(roomJoined);
  room.roomJoined = roomJoined;

  // Ask for player data and set up the game.
  socket.emit('requestCharacterData');
  console.dir('client roomJoined: ' + room.roomJoined);
};

//Process a keyDown event from the keyboard
var keyDownEvent = function keyDownEvent(e) {
  var key = e.which;
  var player = players[hash];

  //Don't process input from dead or nonexistant players
  if (!player || !player.alive) {
    return;
  }

  //Move the player using WASD or Arrow Keys, attack with Space bar or J
  if (key === 87 || key === 38) {
    player.moveUp = true;
  } else if (key === 83 || key === 40) {
    player.moveDown = true;
  } else if (key === 65 || key === 37) {
    player.moveLeft = true;
  } else if (key === 68 || key === 39) {
    player.moveRight = true;
  } else if ((key === 32 || key === 74) && !player.attacking) {
    player.attacking = true;
    sendAttack();
  }
};

//Process a keyUp event from the keyboard
var keyUpEvent = function keyUpEvent(e) {
  var key = e.which;
  var player = players[hash];

  //If the player is dead or nonexistent don't process input
  if (!player || !player.alive) {
    return;
  }

  //Stop the player from moving if they have released the keys
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

//Run this function immediately after the window loads
var init = function init() {

  //Grab the assorted spritesheets for later usage
  gemSprite = document.querySelector('#gemSprite');
  dungeonFloor = document.querySelector('#dungeonFloor');
  healthContainer = document.querySelector('#healthContainer');
  healthBar = document.querySelector('#healthBar');

  //Connect the to the server via socket.io
  socket = io.connect();

  // Choose a character first
  socket.emit('getChars');

  //Hook up all possible socket events with their corresponding handlers
  socket.on('getHash', function (hash) {
    self.hash = hash;
  });

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
  socket.on('roomError', emitError);
  socket.on('updateQueue', updateQueue);
  socket.on('requestToJoin', requestToJoinRoom);
  socket.on('getOpenRoomList', renderAvailableRooms);

  //Hookup the key event listeners
  document.body.addEventListener('keydown', keyDownEvent);
  document.body.addEventListener('keyup', keyUpEvent);
};

//Run the init function when the window loads
window.onload = init;
"use strict";

//Construct the main window (using a given width and height for the canvas)
var GameWindow = function GameWindow(props) {
  return React.createElement(
    "div",
    { "class": "container-fluid" },
    React.createElement(
      "div",
      { "class": "row row-centered" },
      React.createElement("div", { id: "gameInfo", "class": "col-xl-4 col-centered" }),
      React.createElement(
        "div",
        { id: "viewport-parent", "class": "col-xl-4 col-centered" },
        React.createElement("canvas", { id: "viewport", width: props.width, height: props.height }),
        React.createElement(
          "p",
          null,
          "Controls: WASD or Arrow Keys to Move, Space bar or J to attack"
        ),
        React.createElement(
          "p",
          null,
          "Avoid: Red rectangles, will damage when completely red"
        ),
        React.createElement(
          "p",
          null,
          "Gather: Gems on boss death (score)"
        )
      ),
      React.createElement(
        "div",
        { "class": "col-xl-4 col-centered" },
        React.createElement("iframe", { width: "560", height: "315",
          src: "https://www.youtube.com/embed/videoseries?list=PLbzURmDMdJdPlsSgLqqb3IwnY5A0jWK_q",
          frameBorder: "0", allow: "autoplay; encrypted-media", id: "videoFrame" })
      )
    )
  );
};

//Make a call to render the game window above, and pass in the desired canvas dimensions
var renderGame = function renderGame(width, height) {
  ReactDOM.render(React.createElement(GameWindow, { width: width, height: height }), document.querySelector("#main"));

  //Hook up the canvas to JS code
  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');
};

//Make a call to render the game info section
var renderGameInfo = function renderGameInfo(gameInfo) {
  ReactDOM.render(React.createElement(GameInfo, { info: gameInfo }), document.querySelector("#gameInfo"));
};

//Construct the game info window using the given player and boss info
var GameInfo = function GameInfo(props) {

  //Calculate state variables like button usability and progress bar width
  var disabled = props.info.player.points === 0;
  var expBetweenLevels = props.info.player.nextLevel - props.info.player.prevLevel;
  var expRatio = Math.floor((props.info.player.exp - props.info.player.prevLevel) / expBetweenLevels * 100);
  var ratioString = expRatio + "%";
  var style = {
    width: ratioString

    //Return the JSX version of the game info
    //*Note: Render changes based on whether the player is alive or dead
  };return React.createElement(
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
      { "class": "text-info" },
      props.info.player.alive ? "Player Stats" : "Respawn Player"
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
          { id: "increaseHealth", "class": "levelUpButton btn btn-primary", disabled: disabled, onClick: upgradeChar },
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
          { id: "increaseStrength", "class": "levelUpButton btn btn-primary", disabled: disabled, onClick: upgradeChar },
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
          { id: "increaseDefense", "class": "levelUpButton btn btn-primary", disabled: disabled, onClick: upgradeChar },
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
        React.createElement(
          "div",
          { id: "levelUpBar", "class": "progress" },
          React.createElement("div", {
            className: "progress-bar progress-bar-striped progress-bar-animated bg-success",
            style: style,
            role: "progressbar",
            "aria-valuenow": props.info.player.exp,
            "aria-valuemin": props.info.player.prevLevel,
            "aria-valuemax": props.info.player.nextLevel
          })
        )
      )
    ),
    !props.info.player.alive && React.createElement(
      "button",
      { id: "respawnButton", "class": "btn btn-danger", onClick: respawnRequest },
      "Respawn"
    ),
    React.createElement("hr", null),
    React.createElement(
      "h2",
      { "class": "text-warning" },
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

//Construct the character selection window
var CharSelect = function CharSelect(props) {

  //Map the characters object into an array
  var charactersArray = Object.keys(props.characters).map(function (character) {
    return props.characters[character];
  });

  //Return JSX to inform that player that the characters are still loading
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
      { "class": "charPreview card border-secondary col" },
      React.createElement(
        "div",
        { "class": "card-header" },
        React.createElement(
          "h2",
          null,
          character.name
        )
      ),
      React.createElement(
        "div",
        { "class": "card-body" },
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
            { "class": "text-info" },
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
          { "class": "btn btn-lg btn-secondary charButton", onClick: chooseCharacter, selectid: character.name },
          "Select"
        )
      )
    );
  });

  //Return all of the panels (the passed in array auto formats)
  //*Note: break the characters into groups of 4 to help presentation
  return React.createElement(
    "div",
    null,
    React.createElement(
      "h2",
      { id: "charSelectHeader" },
      "Select Your Character"
    ),
    React.createElement("hr", null),
    React.createElement(
      "div",
      { "class": "container-fluid" },
      React.createElement(
        "div",
        { "class": "row row-centered" },
        charList.slice(0, 4)
      ),
      React.createElement(
        "div",
        { "class": "row" },
        charList.slice(4, 8)
      )
    )
  );
};

//Render the character selection window
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

// Creates the HTML for the lobby such as room queuing, joining, and creation. Also holds the open room list.
var renderLobby = function renderLobby(rooms) {
  ReactDOM.render(React.createElement(
    "div",
    { id: "lobbyContainer", "class": "container" },
    React.createElement(
      "div",
      { id: "roomContainer" },
      React.createElement(
        "form",
        { id: "createRoomForm", "class": "row row-centered" },
        React.createElement(
          "p",
          { "class": "col-sm-4 text-centered" },
          React.createElement(
            "label",
            { id: "createLabel", "for": "createRoom" },
            "Create Room"
          )
        ),
        React.createElement(
          "p",
          { "class": "col-sm-3" },
          React.createElement("input", { "class": "form-control", id: "createRoomField", type: "text", name: "createRoom", maxlength: "4", size: "4" })
        ),
        React.createElement(
          "p",
          { "class": "col-sm-3" },
          React.createElement("input", { "class": "input-group-btn btn btn-success", type: "submit", value: "Create Room" })
        )
      ),
      React.createElement(
        "form",
        { id: "joinRoomForm", "class": "row row-centered" },
        React.createElement(
          "p",
          { "class": "col-sm-4 text-centered" },
          React.createElement(
            "label",
            { id: "joinLabel", "for": "joinRoom" },
            "Join a Room"
          )
        ),
        React.createElement(
          "p",
          { "class": "col-sm-3" },
          React.createElement("input", { "class": "form-control", id: "joinRoomField", type: "text", name: "joinRoom", maxlength: "4", size: "4" })
        ),
        React.createElement(
          "p",
          { "class": "col-sm-3" },
          React.createElement("input", { "class": "input-group-btn btn btn-info", type: "submit", value: "Join Room" })
        )
      )
    ),
    React.createElement(
      "div",
      { "class": "row row-centered" },
      React.createElement("div", { "class": "col-sm-4" }),
      React.createElement(
        "section",
        { id: "queueNumber", "class": "col-sm-4 col-centered" },
        " "
      ),
      React.createElement("div", { "class": "col-sm-4" })
    ),
    React.createElement(
      "div",
      { id: "queueContainer", "class": "row row-centered" },
      React.createElement("div", { "class": "col-sm-4" }),
      React.createElement(
        "button",
        { id: "queue", "class": "btn btn-info text-centered col-sm-4 col-centered", onClick: queue },
        "Queue!"
      ),
      React.createElement("div", { "class": "col-sm-4" })
    ),
    React.createElement("div", { id: "roomList", "class": "row row-centered" })
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

  socket.emit('requestOpenRoomList');
};

// Handles error emition.
var emitError = function emitError(error) {
  var errorContainer = document.querySelector("#error");
  errorContainer.classList.remove("hidden");

  // Message will hide after 3 seconds.
  setTimeout(function () {
    errorContainer.classList.add("hidden");
  }, 3000);

  errorContainer.innerHTML = error;
};

// Creates the room box for when we look for open rooms that are joinable. 
var makeRoomBox = function makeRoomBox(roomData) {
  console.dir(roomData);
  console.log(roomData.roomName);
  var roomBox = document.createElement('div');
  var innerRoomBox = document.createElement('div');
  innerRoomBox.className = "card roomBox border-light";
  roomBox.appendChild(innerRoomBox);
  roomBox.className = "col-sm-4 col-centered";
  var roomName = document.createElement('h3');
  roomName.className = 'card-header';
  roomName.innerHTML = roomData.roomName;

  var playerKeys = Object.keys(roomData.players);

  var count = document.createElement('p');
  count.innerHTML = "Players: " + playerKeys.length + "/8";
  count.className = 'card-body';
  var button = document.createElement('button');
  button.innerHTML = 'Join Room';
  button.className = 'btn btn-lg btn-info';
  button.onclick = function () {
    requestToJoinRoom(roomData.roomName);
  };

  innerRoomBox.appendChild(roomName);
  innerRoomBox.appendChild(count);
  innerRoomBox.appendChild(button);
  return roomBox;
};

// Calls for makeRoomBox and appends open rooms to a larger 
// container for the client to choose which open room to join.
var renderAvailableRooms = function renderAvailableRooms(rooms) {
  var roomList = document.querySelector('#roomList');
  roomList.innerHTML = "";
  var roomKeys = Object.keys(rooms);
  console.dir(rooms);
  for (var i = 0; i < roomKeys.length; i++) {
    if (!(rooms[roomKeys[i]].roomName === 'lobby')) {
      roomList.appendChild(makeRoomBox(rooms[roomKeys[i]]));
    }
  }
};
'use strict';

//Kinda self-explanatory- but this updates the local player and draws to the canvas
var update = function update() {
  updateLocalPosition();
  draw();

  //Store the current animation frame
  animationFrame = requestAnimationFrame(update);
};

//Update the local player's position based on input and state
var updateLocalPosition = function updateLocalPosition() {
  var player = players[hash];

  //If the player is dead, stop them from moving and switch the animation to death
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

  //Update the players position
  player.prevX = player.x;
  player.prevY = player.y;

  //Based on player state (thanks to keyboard input) update position
  if (player.moveLeft && player.x >= 2 + player.width / 2) {
    player.destX -= 2;
    //Also change player direction accordingly
    player.direction = player.DIRECTIONS.left;
  }

  if (player.moveRight && player.x <= canvas.width - player.width - 2) {
    player.destX += 2;
    player.direction = player.DIRECTIONS.right;
  }

  if (player.moveUp && player.y >= 2 + player.height / 2) {
    player.destY -= 2;
    player.direction = player.DIRECTIONS.up;
  }

  if (player.moveDown && player.y <= canvas.height - player.height - 2) {
    player.destY += 2;
    player.direction = player.DIRECTIONS.down;
  }

  //Switch player's animation depending on movement and attack state
  if (!player.attacking) {
    if (player.moveUp || player.moveDown || player.moveLeft || player.moveRight) {
      switchAnimation(player, 'walk');
    } else {
      switchAnimation(player, 'meditate');
    }
  } else {
    switchAnimation(player, 'attack');
  }

  //Reset player's ratio and send an update
  player.ratio = 0.05;
  socket.emit('playerMovement', player);
};

//Process character data sent from the server
var handleChars = function handleChars(data) {
  // Load character files into memory for later usage
  var charKeys = Object.keys(data);

  var _loop = function _loop(i) {
    var character = data[charKeys[i]];

    var charImage = new Image();

    //When an image loads, place it in the character image struct
    charImage.onload = function () {
      characterImageStruct[charKeys[i]] = charImage;
    };

    charImage.src = character.imageFile;
  };

  for (var i = 0; i < charKeys.length; i++) {
    _loop(i);
  }

  //Render the character selection window
  renderCharacterSelect(data);
};

//Send a message to the server notifying it of the player's character selection
var chooseCharacter = function chooseCharacter(e) {
  socket.emit('chooseCharacter', { id: e.target.getAttribute('selectid') });
};

// Initiates client-side queueing. Will gray out and make button unpressable while player is waiting to join an instance.
var queue = function queue(e) {
  e.target.disabled = true;
  e.target.innerHTML = 'queued';
  console.log('joining queue');
  socket.emit('joinQueue');
};

// Updates the queue count of the player.
var updateQueue = function updateQueue(hashes) {
  for (var i = 0; i < hashes.length; i++) {
    if (hash === hashes[i]) {
      document.querySelector('#queueNumber').innerHTML = 'Posistion in Queue: ' + (i + 1) + '/' + hashes.length;
      break;
    }
  }
};

// Requests to join room.
var requestToJoinRoom = function requestToJoinRoom(roomName) {
  socket.emit('joinRoom', roomName);
};

// Handles joining the lobby.
var handleLobby = function handleLobby(data) {
  room.roomJoined = 'lobby';
  renderLobby(data);
  // Request rooms that are open
  socket.emit('requestOpenRoomList');
};

//Format player and boss data for Game Info render
var aggregateGameInfo = function aggregateGameInfo() {
  var player = players[hash];
  var bossDetails = {};

  //Package boss data
  if (boss && boss.alive) {
    bossDetails = {
      name: boss.name,
      level: boss.level,
      exp: boss.exp,
      gems: boss.gems
    };
  } else {
    bossDetails = {
      name: 'N/A',
      level: 'N/A',
      exp: 'N/A',
      gems: 'N/A'
    };
  }

  //Package player data
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

//Set this player to the data sent from the server
var setPlayer = function setPlayer(data) {
  hash = data.hash;
  players[hash] = data;
  players[hash].room = room.roomJoined;

  //Render the game window as well as the game info window
  renderGame(600, 600, info);
  var info = aggregateGameInfo();
  renderGameInfo(info);

  //If the update loop isn't running, start it
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }
};

// Sends player attack information to the server for collision detection.
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

//Notifies the player to switch their animation to attacking
//*Note: Soon to be deprecated!
var receiveAttack = function receiveAttack(data) {
  if (players[data.hash]) {
    players[data.hash].attacking = true;
    switchAnimation(players[data.hash], 'attack');
  }
};

//Process player updates sent from the server
var updatePlayer = function updatePlayer(data) {
  //If the character doesn't exist locally, save all of their info
  if (!players[data.hash]) {
    players[data.hash] = data;
  }

  //Only process new updates
  if (players[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  var player = players[data.hash];

  //Determine if game info needs to be re-rendered
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

  //If player info changed, re-render game info
  if (flagToReRenderInfo) {
    var info = aggregateGameInfo();
    renderGameInfo(info);
  }

  // Don't update movement or animations if the update is about this player
  if (hash === data.hash) {
    return;
  }

  //For all other players, update position, and states
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

  //If the player is attacking, switch their animation to reflect that
  if (player.attacking) {
    switchAnimation(player, 'attack');
  }
};

//Process a request from the server to delete a player
var deletePlayer = function deletePlayer(data) {
  if (players[data.hash]) {
    delete players[data.hash];
  }
};

//Disconnect from the server
var disconnect = function disconnect() {
  //Cancel the update loop and delete this player
  if (hash) {
    cancelAnimationFrame(animationFrame);
    delete players[hash];
    animationFrame = undefined;
  }
};

//Spawn a boss given data from the server
var spawnBoss = function spawnBoss(data) {
  boss = data;

  //Update game info
  var info = aggregateGameInfo();
  renderGameInfo(info);
};

//Update a boss given data from the server
var updateBoss = function updateBoss(data) {
  //If the boss hasn't been spawned yet for this player, ignore updates
  if (!boss) {
    return;
  }

  var keys = Object.keys(data);

  //Iterate over the sent keys and update the current boss object
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    boss[key] = data[key];
  }
};

//Process a request from the server to update a boss's attack
var updateBossAttack = function updateBossAttack(data) {
  var progress = data.progress / data.complete;
  //Create a new damage area if the attack is new, or update an existing one
  if (!damageAreas[data.id]) {
    damageAreas[data.id] = new DamageArea({
      x: data.x, y: data.y, w: data.w, h: data.h
    }, progress);
  } else {
    damageAreas[data.id].update(progress);
  }
};

//Process a request from the server to resolve a boss's attack
var removeBossAttack = function removeBossAttack(data) {
  //if the attack exists, remove it so that it won't be drawn
  if (damageAreas[data.id]) {
    damageAreas[data.id] = undefined;
    delete damageAreas[data.id];
  }
};

//Process a request from the server to kill the boss
var bossDeath = function bossDeath() {
  //Animate the boss appropriately and re-render the game info
  boss.anim = boss.ANIMS.death;
  boss.alive = false;
  damageAreas = {};
  var info = aggregateGameInfo();
  renderGameInfo(info);
};

//Handle a player request to upgrade their character
var upgradeChar = function upgradeChar(e) {
  //Determine which stat they wish to upgrade based on the button they pushed
  var id = e.target.getAttribute('id');
  switch (id) {
    case 'increaseHealth':
      socket.emit('characterUpgrade', { upgrade: 'health' });
      break;
    case 'increaseStrength':
      socket.emit('characterUpgrade', { upgrade: 'strength' });
      break;
    case 'increaseDefense':
      socket.emit('characterUpgrade', { upgrade: 'defense' });
      break;
  }
};

//Process a request from the server to dispense a given number of gems
var dispenseGems = function dispenseGems(data) {
  var gemCount = data.gems;

  for (var i = 0; i < gemCount; i++) {
    //Give the gem a random velocity
    var randAngle = Math.random() * 360;
    var radian = randAngle * Math.PI / 180;
    var speed = 20 * Math.random() + 2;
    var vector = {
      x: Math.sin(radian) * speed,
      y: Math.cos(radian) * speed
    };

    //Randomly choose one of four gem sprites
    var sprite = Math.floor(Math.random() * 4);

    //Construct the gem object
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

    //Add the gem to the gems array for draw calls
    gems.push(gem);
  }
};

var collectGem = function collectGem() {
  socket.emit('collectGem');
};

var respawnRequest = function respawnRequest() {
  socket.emit('respawnRequest');
};
