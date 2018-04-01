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

const roomSetup = (roomJoined) => {
  console.dir(roomJoined);
  room.roomJoined = roomJoined;

  // To Do: On room join code
  // Ask for player data and set up the game.
  socket.emit('requestCharacterData');
  console.dir(`client roomJoined: ${room.roomJoined}`);
};

const keyDownEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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

const keyUpEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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

const init = () => {
  // renderGame(600, 600);

  // canvas = document.querySelector('#viewport');
  // ctx = canvas.getContext('2d');

  gemSprite = document.querySelector('#gemSprite');
  dungeonFloor = document.querySelector('#dungeonFloor');
  healthContainer = document.querySelector('#healthContainer');
  healthBar = document.querySelector('#healthBar');

  socket = io.connect();

  // Choose a character first
  socket.emit('getChars');

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


  document.body.addEventListener('keydown', keyDownEvent);
  document.body.addEventListener('keyup', keyUpEvent);
};

window.onload = init;
