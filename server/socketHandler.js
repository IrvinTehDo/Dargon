// Import necessary modules
const xxh = require('xxhashjs');
const classes = require('./classes');

const { Character } = classes;
const game = require('./game');

// Define a players object and the stats that the client will be allowed to update
const players = {};
const playerAttributesToCopy = [
  'x',
  'y',
  'prevX',
  'prevY',
  'destX',
  'destY',
  'ratio',
  'frame',
  'anim',
  'direction',
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'attacking',
];

// Initialize the instance handler
const instanceHandler = require('./instanceHandler');

instanceHandler.setUpLobby();

let io;

// Attach custom socket events
const init = (ioInstance) => {
  io = ioInstance;

  // When the socket connects
  io.on('connection', (sock) => {
    const socket = sock;

    // Construct a new hash and attach it to the socket
    const time = new Date().getTime();
    const hash = xxh.h32(`${socket.id}${time}`, 0x010A020B).toString(16);

    socket.hash = hash;

    // Process a request to get the available character templates
    socket.on('getChars', () => {
      socket.emit('availableChars', game.getAvailableChars());
      socket.emit('getHash', hash);
    });

    // Process a request to choose a character
    socket.on('chooseCharacter', (data) => {
      // Validate that the requested template does exist
      if (game.validateChar(data.id)) {
        // Create a new character for the client using the requested template
        const character = game.getChar(data.id);
        const randX = Math.floor(Math.random() * 400) + 100;
        const randY = Math.floor(Math.random() * 400) + 100;
        players[hash] = new Character(
          character.name, hash, randX, randY,
          {
            maxHealth: character.maxHealth,
            strength: character.strength,
            defense: character.defense,
          },
        );

        // Move the client over to the lobby
        socket.join('lobby');
        socket.roomJoined = 'lobby';
        instanceHandler.roomJoin('lobby', socket);
        socket.emit('moveToLobby');
      }
    });

    // Process a request to respawn the player
    socket.on('respawnRequest', () => {
      // Create a new player using their previously chosen template
      const player = players[socket.hash];
      const character = game.getChar(player.name);
      const randX = Math.floor(Math.random() * 400) + 100;
      const randY = Math.floor(Math.random() * 400) + 100;
      players[hash] = new Character(
        character.name, hash, randX, randY,
        {
          maxHealth: character.maxHealth,
          strength: character.strength,
          defense: character.defense,
        },
      );

      // Update all players in the room, including the player that requested the respawn
      players[hash].lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', players[hash]);
    });

    // Process a request to get character data
    socket.on('requestCharacterData', () => {
      socket.emit('setPlayer', players[hash]);
      instanceHandler.rooms[socket.roomJoined].players[hash] = players[hash];
      io.sockets.in('lobby').emit('getOpenRoomList', instanceHandler.getOpenRooms());

      // If the room doesn't have one, spawn a boss
      if (!game.hasBoss(socket.roomJoined)) {
        // Calculate the total level of all players in the room
        const level = game.calcAggregateLevel(
          players,
          instanceHandler.rooms[socket.roomJoined].players,
        );

        // Spawn a new boss and then notify the room
        game.spawnBoss(socket.roomJoined, level, (boss) => {
          instanceHandler.rooms[socket.roomJoined].enemies[boss.sprite] = boss;
          io.sockets.in(socket.roomJoined).emit('spawnBoss', boss);
        });
      } else {
        // Request the client to 'spawn' the existing boss
        socket.emit('spawnBoss', game.getBoss(socket.roomJoined));
      }
    });

    // Process a request to move a player
    socket.on('playerMovement', (data) => {
      const player = players[socket.hash];

      // If the player doesn't exist or isn't alive, exit
      if (!player || !player.alive) {
        return;
      }

      // Copy the attributes that a client is allowed to modify
      for (let i = 0; i < playerAttributesToCopy.length; i++) {
        const key = playerAttributesToCopy[i];
        player[key] = data[key];
      }

      // Update all players in the room of this change
      player.lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', player);
    });

    // Process a request for a player to attack
    socket.on('sendAttack', (data, roomName) => {
      const player = players[socket.hash];

      if (!player || !player.alive) {
        return;
      }

      // Adds attack to the list of attacks to be processed by server.
      instanceHandler.addAttack(roomName, data, player);
      // io.sockets.in(socket.roomJoined).emit('receiveAttack', data);
    });

    // process a request to upgrade a character
    socket.on('characterUpgrade', (data) => {
      const player = players[socket.hash];

      if (!player || !player.alive) {
        return;
      }

      // If the player has upgrade points to spend, process their upgrade request
      if (player.pointsToAllocate > 0) {
        player.pointsToAllocate--;
        game.upgradePlayer(player, data.upgrade, (p) => {
          const plr = p;
          player.lastUpdate = new Date().getTime();
          io.sockets.in(socket.roomJoined).emit('updatePlayer', plr);
        });
      }
    });

    // Process a players request to collect a gem
    socket.on('collectGem', () => {
      const player = players[socket.hash];

      if (!player || !player.alive) {
        return;
      }

      // If the player has gems to collect, proces their request
      if (player.gemsToCollect > 0) {
        player.gemsToCollect--;
        player.gems++;
        io.sockets.in(socket.roomJoined).emit('updatePlayer', player);
      }
    });

    // create and join
    socket.on('createRoom', (roomName) => {
      if (instanceHandler.roomInit(roomName, socket)) {
        if (instanceHandler.roomJoin(roomName, socket)) {
          if (socket.roomJoined === 'lobby') {
            delete instanceHandler.rooms.lobby.players[socket.hash];
          } else {
            delete instanceHandler.rooms[socket.roomJoined].players[socket.hash];
          }
          socket.roomJoined = roomName;
          socket.emit('joined', roomName);
        }
      }
    });

    // join only
    socket.on('joinRoom', (roomName) => {
      if (instanceHandler.roomJoin(roomName, socket, io)) {
        if (socket.roomJoined === 'lobby') {
          delete instanceHandler.rooms.lobby.players[socket.hash];
        } else {
          delete instanceHandler.rooms[socket.roomJoined].players[socket.hash];
        }
        socket.roomJoined = roomName;

        socket.emit('joined', roomName);
      }
    });

    // Add socket to queue of players.
    socket.on('joinQueue', () => {
      instanceHandler.addToQueue(socket, io);
    });

    // requests an array of open rooms
    socket.on('requestOpenRoomList', () => {
      socket.emit('getOpenRoomList', instanceHandler.getOpenRooms());
    });

    // When a socket disconnects
    socket.on('disconnect', () => {
      if (!players[socket.hash]) {
        return;
      }

      // Delete the player from all important objects / arrays and notify the room
      io.sockets.in(socket.roomJoined).emit('deletePlayer', players[socket.hash]);
      delete instanceHandler.rooms[socket.roomJoined].players[socket.hash];
      players[socket.hash] = undefined;
      delete players[socket.hash];
      socket.leave(socket.roomJoined);
      // Should be an open space in a game now, update open rooms
      io.sockets.in('lobby').emit('getOpenRoomList', instanceHandler.getOpenRooms());
    });
  });
};

// Spawn a boss in a given room (used for delayed spawning)
const spawnBoss = (roomId) => {
  // Calculate the new boss's level
  const level = game.calcAggregateLevel(
    players,
    instanceHandler.rooms[roomId].players,
  );

  // Have the game spawn a new boss at the requested level
  game.spawnBoss(roomId, level, (boss) => {
    instanceHandler.rooms[roomId].enemies[boss.sprite] = boss;
    io.sockets.in(roomId).emit('spawnBoss', boss);
  });
};

// Update various components of the game
const update = () => {
  // Update the boss's positions and attacks
  game.updateBosses((roomId, data) => {
    io.sockets.in(roomId).emit('updateBoss', data);
  });

  // Update all active boss attacks
  game.updateBossAttacks((roomId, data) => {
    io.sockets.in(roomId).emit('updateBossAttack', data);
  });

  // Update and resolve all boss attacks that are ready to resolve
  game.resolveBossAttacks(players, instanceHandler.rooms, (roomId, data) => {
    io.sockets.in(roomId).emit('removeBossAttack', data);
  }, (roomId, p) => {
    const player = p;
    player.lastUpdate = new Date().getTime() + 1000;
    io.sockets.in(roomId).emit('updatePlayer', player);
  });

  // Determine if a room has requested a new spawn
  const spawnQueue = game.getSpawnQueue();

  // Spawn new bosses if necessary
  for (let i = 0; i < spawnQueue.length; i++) {
    spawnBoss(spawnQueue[i]);
    game.spliceSpawnQueue(i);
  }

  // Process attack array
  instanceHandler.processAttacks(players, io);

  // process queue array
  instanceHandler.processQueue(io);

  // server tick of 20 (run function again)
  setTimeout(update, 20);
};

// Run the update function initially
update();

module.exports = {
  init,
};
