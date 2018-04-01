const physicsHandler = require('./physics/index.js');

const xxh = require('xxhashjs');

const game = require('./game');

const rooms = {};

const queue = [];

const setUpLobby = () => {
  // Lobby messes up real bad and rather not use dot notation than
  // having to implement a check for it every time.
  /*eslint-disable */
  rooms['lobby'] = {};
  rooms['lobby'].roomName = 'lobby';
  rooms['lobby'].players = {};
  rooms['lobby'].attacks = [];
  rooms['lobby'].enemies = {};
  /* eslint-enable */
};

// Initializes and creates an instance.
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

// Attempts to join a room, returns true if we joined a room successfully.
const roomJoin = (roomName, reqSocket) => {
  // error if room doesn't exist.
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
        for (let i = 0; i < rooms[roomKeys[q]].attacks.length; i++) {
          // For each enemy
          for (let z = 0; z < keys.length; z++) {
            const enemy = rooms[roomKeys[q]].enemies[keys[z]];

            const hit = physicsHandler.checkHitEnemy(rooms[roomKeys[q]].attacks[i], enemy);

            if (hit) {
              // Handle damage calculations here
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

// Add an attack to be processed next server tick.
const addAttack = (roomName, attack, player) => {
  console.log('attack added');
  const att = attack;
  att.player = player;
  rooms[roomName].attacks.push(attack);
  console.dir(rooms[roomName].attacks);
};

// Checks for what player hashes are currently in queue and returns a temporary array of hashs.
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
  // Updates all players in lobby to update queue.
  io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
};

const processQueue = (io) => {
  // Process Queue
  const roomKeys = Object.keys(rooms);

  // If fewer than 3, we don't make a new instance
  // but try to fill up ones that don't have maximum players.
  if (queue.length <= 3) {
    for (let z = 0; z < roomKeys.length; z++) {
      const playerKey = Object.keys(rooms[roomKeys[z]].players);
      if (playerKey.length <= 7 && rooms[roomKeys[z]].roomName !== 'lobby' && queue.length > 0) {
        // ask the socket to join, cause it gets messy
        // if we try to do it on the server's end.
        queue[0].emit('requestToJoin', rooms[roomKeys[z]].roomName);
        queue.splice(0);
        io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
        break;
      }
    }
  } else if (queue.length > 3) {
    // if more than 3 players in queue, make a new instance for them.
    let time = new Date().getTime();
    let hash = xxh.h32(`${time}`, 0x010A020B).toString(16).substr(0, 4);
    // randomize until we find an empty.
    while (rooms[hash]) {
      time = new Date().getTime();
      hash = xxh.h32(`${time}`, 0x010A020B).toString(16).substr(0, 4);
    }

    // Initialize the room and asks the first 4 in queue to join it.
    roomInit(hash, queue[0]);

    queue[0].emit('requestToJoin', rooms[hash].roomName);
    queue[1].emit('requestToJoin', rooms[hash].roomName);
    queue[2].emit('requestToJoin', rooms[hash].roomName);
    queue[3].emit('requestToJoin', rooms[hash].roomName);

    queue.splice(0, 4);
    // update queue
    io.sockets.in('lobby').emit('updateQueue', hashesInQueue());
  }
};

// returns array of rooms that aren't at maximum player, in this case 8
const getOpenRooms = () => {
  const availableRooms = {};

  const roomKeys = Object.keys(rooms);
  for (let i = 0; i < roomKeys.length; i++) {
    const playerKeys = Object.keys(rooms[roomKeys[i]].players);
    if (playerKeys.length < 8) {
      availableRooms[rooms[roomKeys[i]].roomName]
              = rooms[roomKeys[i]];
    }
  }

  return availableRooms;
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
  getOpenRooms,
};
