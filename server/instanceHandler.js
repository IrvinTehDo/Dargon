const physicsHandler = require('./physics/index.js');

const xxh = require('xxhashjs');

const game = require('./game');

const rooms = {};

const queue = [];

const setUpLobby = () => {
  /*eslint-disable */
  rooms['lobby'] = {};
  rooms['lobby'].roomName = 'lobby';
  rooms['lobby'].players = {};
  rooms['lobby'].attacks = [];
  rooms['lobby'].enemies = {};
  /* eslint-enable */
};

// 'roomError' doesnt exist yet, can change to whatever at this point

const roomInit = (roomName, reqSocket) => {
  if (rooms[roomName]) {
    // send error here cause room already exists
    reqSocket.emit('roomError', `${roomName} already exists`);
    return false;
  }

  rooms[roomName] = {
    roomName,
    players: {},
    attacks: [],
    enemies: {},
  };
  console.log(`instance ${roomName} created`);
  console.dir(rooms);

  return true;
};

const roomJoin = (roomName, reqSocket) => {
  if (!rooms[roomName]) {
    reqSocket.emit('roomError', `${roomName} does not exist`);
    console.dir(`${roomName} does not exist`);
    return false;
  }

  console.log('instance joined');

  reqSocket.leave(reqSocket.roomJoined);
  reqSocket.join(roomName);
  rooms[roomName].players[reqSocket.hash] = reqSocket.player;
  return true;
};

// Process All attacks in a room.
const processAttacks = (players, io) => {
  const roomKeys = Object.keys(rooms);
  for (let q = 0; q < roomKeys.length; q++) {
    if (roomKeys[q].roomName !== 'lobby') {
      if (rooms[roomKeys[q]].attacks.length > 0) {
      // Check if player and boss hit
        // Get all enemies/bosses
        const keys = Object.keys(rooms[roomKeys[q]]
          .enemies); // Object.keys(rooms[roomName].enemies);
        // TO DO once rooms are properly set up: change rooms.lobby to rooms[roomName]
        // and implement a check to make sure we're not checking lobby.
        // For each attack
        for (let i = 0; i < rooms[roomKeys[q]].attacks.length; i++) {
          // For each enemy
          for (let z = 0; z < keys.length; z++) {
            const enemy = rooms[roomKeys[q]].enemies[keys[z]];

            const hit = physicsHandler.checkHitEnemy(rooms[roomKeys[q]].attacks[i], enemy);

            if (hit) {
              // Handle damage calculations here
            // game.takeDamage('lobby', 1, io); // temporary call to lobby
              const damage = game.calcDamage(rooms[roomKeys[q]].attacks[i].player, enemy);
              game.takeDamage(roomKeys[q], damage, players, rooms[roomKeys[q]].players, io);
              console.log('hit');
            } else {
              console.log('miss');
            }
          }

          rooms[roomKeys[q]].attacks.splice(i);
          i--;
        }
      }
    }
  }
};

const addAttack = (roomName, attack, player) => {
  console.log('attack added');
  const att = attack;
  att.player = player;
  rooms[roomName].attacks.push(attack);
  console.dir(rooms[roomName].attacks);
};


const hashesInQueue = () => {
  const tempQueueHashes = [];

  for (let i = 0; i < queue.length; i++) {
    tempQueueHashes.push(queue[i].hash);
  }

  return tempQueueHashes;
};

const addToQueue = (socket, io) => {
  // Add hash to queue
  console.log(`added ${socket.hash} to queue`);
  queue.push(socket);
  // io.sockets.in('lobby').emit('updateQueue', queue);
  io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
};

const processQueue = (io) => {
  // Process Queue
  const roomKeys = Object.keys(rooms);


  if (queue.length <= 3) {
    for (let z = 0; z < roomKeys.length; z++) {
      const playerKey = Object.keys(rooms[roomKeys[z]].players);
      if (playerKey.length <= 7 && rooms[roomKeys[z]].roomName !== 'lobby' && queue.length > 0) {
        queue[0].emit('requestToJoin', rooms[roomKeys[z]].roomName);
        queue.splice(0);
        io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
        break;
      }
    }
  } else if (queue.length > 3) {
    let time = new Date().getTime();
    let hash = xxh.h32(`${time}`, 0x010A020B).toString(16).substr(0, 4);

    while (rooms[hash]) {
      time = new Date().getTime();
      hash = xxh.h32(`${time}`, 0x010A020B).toString(16).substr(0, 4);
    }

    roomInit(hash, queue[0]);

    queue[0].emit('requestToJoin', rooms[hash].roomName);
    queue[1].emit('requestToJoin', rooms[hash].roomName);
    queue[2].emit('requestToJoin', rooms[hash].roomName);
    queue[3].emit('requestToJoin', rooms[hash].roomName);

    queue.splice(0, 4);
    io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
  }
};

module.exports = {
  rooms,
  setUpLobby,
  roomInit,
  roomJoin,
  addAttack,
  processAttacks,
  addToQueue,
  processQueue,
};
