const physicsHandler = require('./physics/index.js');

const rooms = {};

const setUpLobby = () => {
  rooms.lobby = {};
  rooms.lobby.roomName = 'lobby';
  rooms.lobby.players = {};
  // temporary
  rooms.lobby.attacks = [];
  rooms.lobby.enemies = {};
};

// 'roomError' doesnt exist yet, can change to whatever at this point

const roomInit = (roomName, reqSocket) => {
  if (rooms[roomName]) {
    // send error here cause room already exists
    reqSocket.emit('roomError', `${roomName} already exists`);
    return false;
  }

  // console.log('instance created');

  rooms[roomName] = {
    roomName,
    players: {},
    attacks: [],
    enemies: {},
  };

  console.dir(rooms);

  return true;
};

const roomJoin = (roomName, reqSocket) => {
  if (!rooms[roomName]) {
    reqSocket.emit('roomError', `${roomName} does not exist`);
    // console.dir(`${roomName} does not exist`);
    return false;
  }

  console.log('instance joined');

  reqSocket.leave(reqSocket.roomJoined);
  reqSocket.join(roomName);
  rooms[roomName].players[reqSocket.hash] = reqSocket.player;
  return true;
};

// Process All attacks in a room.
const processAttacks = (roomName) => {
  if (rooms[roomName].attacks.length > 0) {
    // Check if player and boss hit

    // Get all enemies/bosses
    const keys = Object.keys(rooms.lobby.enemies); // Object.keys(rooms[roomName].enemies);
    // TO DO once rooms are properly set up: change rooms.lobby to rooms[roomName]
    // and implement a check to make sure we're not checking lobby.

    // For each attack
    for (let i = 0; i < rooms.lobby.attacks.length; i++) {
      // For each enemy
      for (let z = 0; z < keys.length; z++) {
        const enemy = rooms.lobby.enemies[keys[z]];

        const hit = physicsHandler.checkHitEnemy(rooms.lobby.attacks[i], enemy);

        if (hit) {
          // Handle damage calculations here
          console.log('hit');
        } else {
          console.log('miss');
        }
      }

      rooms[roomName].attacks.splice(i);
      i--;
    }
  }
};

const addAttack = (roomName, attack) => {
  rooms[roomName].attacks.push(attack);
};

module.exports = {
  rooms,
  setUpLobby,
  roomInit,
  roomJoin,
  addAttack,
  processAttacks,
};
