//Kinda self-explanatory- but this updates the local player and draws to the canvas
const update = () => {
  updateLocalPosition();
  draw();

  //Store the current animation frame
  animationFrame = requestAnimationFrame(update);
};

//Update the local player's position based on input and state
const updateLocalPosition = () => {
  const player = players[hash];

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
  if (player.moveLeft && player.x >= (2 + player.width / 2)) {
    player.destX -= 2;
    //Also change player direction accordingly
    player.direction = player.DIRECTIONS.left;
  }

  if (player.moveRight && player.x <= canvas.width - player.width - 2) {
    player.destX += 2;
    player.direction = player.DIRECTIONS.right;
  }

  if (player.moveUp && player.y >= (2 + player.height / 2)) {
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
const handleChars = (data) => {
  // Load character files into memory for later usage
  const charKeys = Object.keys(data);
  for (let i = 0; i < charKeys.length; i++) {
    const character = data[charKeys[i]];

    const charImage = new Image();

    //When an image loads, place it in the character image struct
    charImage.onload = () => {
      characterImageStruct[charKeys[i]] = charImage;
    };

    charImage.src = character.imageFile;
  }

  //Render the character selection window
  renderCharacterSelect(data);
};

//Send a message to the server notifying it of the player's character selection
const chooseCharacter = (e) => {
  socket.emit('chooseCharacter', { id: e.target.getAttribute('selectid') });
};

// Initiates client-side queueing. Will gray out and make button unpressable while player is waiting to join an instance.
const queue = (e) => {
  e.target.disabled = true;
  e.target.innerHTML = 'queued';
  console.log('joining queue');
  socket.emit('joinQueue');
};

// Updates the queue count of the player.
const updateQueue = (hashes) => {
  for (let i = 0; i < hashes.length; i++) {
    if (hash === hashes[i]) {
      document.querySelector('#queueNumber').innerHTML = `Posistion in Queue: ${i + 1}/${hashes.length}`;
      break;
    }
  }
};

// Requests to join room.
const requestToJoinRoom = (roomName) => {
  socket.emit('joinRoom', roomName);
};

// Handles joining the lobby.
const handleLobby = (data) => {
  room.roomJoined = 'lobby';
  renderLobby(data);
  // Request rooms that are open
  socket.emit('requestOpenRoomList');
};

//Format player and boss data for Game Info render
const aggregateGameInfo = () => {
  const player = players[hash];
  let bossDetails = {};

  //Package boss data
  if (boss && boss.alive) {
    bossDetails = {
      name: boss.name,
      level: boss.level,
      exp: boss.exp,
      gems: boss.gems,
    };
  } else {
    bossDetails = {
      name: 'N/A',
      level: 'N/A',
      exp: 'N/A',
      gems: 'N/A',
    };
  }

  //Package player data
  const info = {
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
      alive: player.alive,
    },
    boss: bossDetails,
  };

  return info;
};

//Set this player to the data sent from the server
const setPlayer = (data) => {
  hash = data.hash;
  players[hash] = data;
  players[hash].room = room.roomJoined;


  //Render the game window as well as the game info window
  renderGame(600, 600, info);
  const info = aggregateGameInfo();
  renderGameInfo(info);

  //If the update loop isn't running, start it
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }
};

// Sends player attack information to the server for collision detection.
const sendAttack = () => {
  const player = players[hash];

  const attack = {
    hash,
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };

  socket.emit('sendAttack', attack, player.room);
};

//Notifies the player to switch their animation to attacking
//*Note: Soon to be deprecated!
const receiveAttack = (data) => {
  if (players[data.hash]) {
    players[data.hash].attacking = true;
    switchAnimation(players[data.hash], 'attack');
  }
};

//Process player updates sent from the server
const updatePlayer = (data) => {
  //If the character doesn't exist locally, save all of their info
  if (!players[data.hash]) {
    players[data.hash] = data;
  }

  //Only process new updates
  if (players[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  const player = players[data.hash];

  //Determine if game info needs to be re-rendered
  let flagToReRenderInfo = false;
  if (player.exp != data.exp
    || player.pointsToAllocate != data.pointsToAllocate
    || player.gems != data.gems
    || player.alive != data.alive
  ) {
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
    const info = aggregateGameInfo();
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
const deletePlayer = (data) => {
  if (players[data.hash]) {
    delete players[data.hash];
  }
};

//Disconnect from the server
const disconnect = () => {
  //Cancel the update loop and delete this player
  if (hash) {
    cancelAnimationFrame(animationFrame);
    delete players[hash];
    animationFrame = undefined;
  }
};

//Spawn a boss given data from the server
const spawnBoss = (data) => {
  boss = data;
  
  //Update game info
  const info = aggregateGameInfo();
  renderGameInfo(info);
};

//Update a boss given data from the server
const updateBoss = (data) => {
  //If the boss hasn't been spawned yet for this player, ignore updates
  if (!boss) {
    return;
  }

  const keys = Object.keys(data);

  //Iterate over the sent keys and update the current boss object
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    boss[key] = data[key];
  }
};

//Process a request from the server to update a boss's attack
const updateBossAttack = (data) => {
  const progress = data.progress / data.complete;
  //Create a new damage area if the attack is new, or update an existing one
  if (!damageAreas[data.id]) {
    damageAreas[data.id] = new DamageArea({
      x: data.x, y: data.y, w: data.w, h: data.h,
    }, progress);
  } else {
    damageAreas[data.id].update(progress);
  }
};

//Process a request from the server to resolve a boss's attack
const removeBossAttack = (data) => {
  //if the attack exists, remove it so that it won't be drawn
  if (damageAreas[data.id]) {
    damageAreas[data.id] = undefined;
    delete damageAreas[data.id];
  }
};

//Process a request from the server to kill the boss
const bossDeath = () => {
  //Animate the boss appropriately and re-render the game info
  boss.anim = boss.ANIMS.death;
  boss.alive = false;
  damageAreas = {};
  const info = aggregateGameInfo();
  renderGameInfo(info);
};

//Handle a player request to upgrade their character
const upgradeChar = (e) => {
  //Determine which stat they wish to upgrade based on the button they pushed
  const id = e.target.getAttribute('id');
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
const dispenseGems = (data) => {
  const gemCount = data.gems;

  for (let i = 0; i < gemCount; i++) {
    //Give the gem a random velocity
    const randAngle = Math.random() * 360;
    const radian = (randAngle * Math.PI) / 180;
    const speed = 20 * Math.random() + 2;
    const vector = {
      x: Math.sin(radian) * speed,
      y: Math.cos(radian) * speed,
    };
    
    //Randomly choose one of four gem sprites
    const sprite = Math.floor(Math.random() * 4);

    //Construct the gem object
    const gem = {
      x: boss.x,
      y: boss.y,
      ticks: 0,
      activateMagnet: 200,
      radian,
      speed,
      vector,
      sprite,
    };

    //Add the gem to the gems array for draw calls
    gems.push(gem);
  }
};

const collectGem = () => {
  socket.emit('collectGem');
};

const respawnRequest = () => {
  socket.emit('respawnRequest');
};
