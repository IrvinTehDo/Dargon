//Define useful variables for all files
let canvas,
  ctx;
let socket,
  hash;
let animationFrame;

const players = {};
let boss;

const room = {};
const frameCounter = 0;

let dungeonFloor,
  gemSprite;

let healthContainer,
  healthBar;

// Sets up the client game room they're about to join.
const roomSetup = (roomJoined) => {
  console.dir(roomJoined);
  room.roomJoined = roomJoined;

  // Ask for player data and set up the game.
  socket.emit('requestCharacterData');
  console.dir(`client roomJoined: ${room.roomJoined}`);
};

//Process a keyDown event from the keyboard
const keyDownEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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
const keyUpEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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
const init = () => {

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
  socket.on('getHash', (hash) => {
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
