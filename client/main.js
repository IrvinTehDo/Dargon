let canvas,
  ctx;
let socket,
  hash;
let animationFrame;

const players = {};
let boss;

const room = {};
const frameCounter = 0;

let defaultChar;

const roomSetup = (roomJoined) => {
  room.roomJoined = roomJoined;
  // To Do: On room join code
  console.dir(roomJoined);
};

// Handles join/create room button. Only allows users to join rooms only if they're in the lobby.
const joinRoom = (e, roomName, create) => {
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

const keyDownEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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

const keyUpEvent = (e) => {
  const key = e.which;
  const player = players[hash];

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
  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');

  defaultChar = document.querySelector('#defaultChar');

  socket = io.connect();
  socket.on('joined', roomSetup);
  socket.on('setPlayer', setPlayer);
  socket.on('receiveAttack', receiveAttack);
  socket.on('updatePlayer', updatePlayer);
  socket.on('deletePlayer', deletePlayer);
  socket.on('disconnect', disconnect);
  
  socket.on('spawnBoss', spawnBoss);
  socket.on('updateBoss', updateBoss);

  const createRoomForm = document.querySelector('#createRoomForm');
  const sendCreateReq = e => joinRoom(e, createRoomForm.querySelector('#createRoomField').value, true);
  createRoomForm.addEventListener('submit', sendCreateReq);

  const joinRoomForm = document.querySelector('#joinRoomForm');
  const sendJoinReq = e => joinRoom(e, joinRoomForm.querySelector('#joinRoomField').value, false);
  joinRoomForm.addEventListener('submit', sendJoinReq);

  document.body.addEventListener('keydown', keyDownEvent);
  document.body.addEventListener('keyup', keyUpEvent);
};

window.onload = init;
