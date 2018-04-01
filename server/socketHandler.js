const xxh = require('xxhashjs');

const classes = require('./classes');

const { Character } = classes;

const game = require('./game');
// const { Message } = classes;

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

const instanceHandler = require('./instanceHandler');

instanceHandler.setUpLobby();

// console.dir(instanceHandler.rooms);

let io;

// Attach custom socket events
const init = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (sock) => {
    const socket = sock;

    const time = new Date().getTime();
    const hash = xxh.h32(`${socket.id}${time}`, 0x010A020B).toString(16);

    socket.hash = hash;

    socket.on('getChars', () => {
      socket.emit('availableChars', game.getAvailableChars());
      socket.emit('getHash', hash);
    });

    socket.on('chooseCharacter', (data) => {
      if (game.validateChar(data.id)) {
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
        // socket.emit('setPlayer', players[hash]);
        socket.join('lobby');
        socket.roomJoined = 'lobby';
        instanceHandler.roomJoin('lobby', socket);
        socket.emit('moveToLobby');
      }
    });

    socket.on('respawnRequest', () => {
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

      players[hash].lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', players[hash]);
    });

    socket.on('requestCharacterData', () => {
      socket.emit('setPlayer', players[hash]);
      instanceHandler.rooms[socket.roomJoined].players[hash] = players[hash];
      io.sockets.in('lobby').emit('getOpenRoomList', instanceHandler.getOpenRooms());
      if (!game.hasBoss(socket.roomJoined)) {
        const level = game.calcAggregateLevel(
          players,
          instanceHandler.rooms[socket.roomJoined].players,
        );

        game.spawnBoss(socket.roomJoined, level, (boss) => {
          console.log(`spawned boss in ${socket.roomJoined}`);
          instanceHandler.rooms[socket.roomJoined].enemies[boss.sprite] = boss;
          io.sockets.in(socket.roomJoined).emit('spawnBoss', boss);
        });
      } else {
        socket.emit('spawnBoss', game.getBoss(socket.roomJoined));
      }
    });


    socket.on('playerMovement', (data) => {
      // Should change to a setter that validates data and moves to the existing class!
      const player = players[socket.hash];

      if (!player.alive) {
        return;
      }

      for (let i = 0; i < playerAttributesToCopy.length; i++) {
        const key = playerAttributesToCopy[i];
        player[key] = data[key];
      }

      player.lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', player);
    });

    socket.on('sendAttack', (data, roomName) => {
      const player = players[socket.hash];

      if (!player.alive) {
        return;
      }

      // Adds attack to the list of attacks to be processed by server.
      instanceHandler.addAttack(roomName, data, player);
      console.log(`attack recieved from ${roomName}`);
      // io.sockets.in(socket.roomJoined).emit('receiveAttack', data);
    });

    socket.on('characterUpgrade', (data) => {
      const player = players[socket.hash];

      if (!player.alive) {
        return;
      }

      if (player.pointsToAllocate > 0) {
        player.pointsToAllocate--;
        game.upgradePlayer(player, data.upgrade, (p) => {
          const plr = p;
          player.lastUpdate = new Date().getTime();
          io.sockets.in(socket.roomJoined).emit('updatePlayer', plr);
        });
      }
    });

    socket.on('collectGem', () => {
      const player = players[socket.hash];

      if (!player.alive) {
        return;
      }

      if (player.gemsToCollect > 0) {
        player.gemsToCollect--;
        player.gems++;
        io.sockets.in(socket.roomJoined).emit('updatePlayer', player);
      }
    });

    // socket.on('custom-event', (data) => {});

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
          console.log('create room and joined');
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
        console.log('joined room');
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

    socket.on('disconnect', () => {
      if (!players[socket.hash]) {
        return;
      }

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

const spawnBoss = (roomId) => {
  const level = game.calcAggregateLevel(
    players,
    instanceHandler.rooms[roomId].players,
  );

  game.spawnBoss(roomId, level, (boss) => {
    console.log(`spawned boss in ${roomId}`);
    instanceHandler.rooms[roomId].enemies[boss.sprite] = boss;
    io.sockets.in(roomId).emit('spawnBoss', boss);
  });
};

const update = () => {
  game.updateBosses((roomId, data) => {
    io.sockets.in(roomId).emit('updateBoss', data);
  });

  game.updateBossAttacks((roomId, data) => {
    io.sockets.in(roomId).emit('updateBossAttack', data);
  });

  game.resolveBossAttacks(players, instanceHandler.rooms, (roomId, data) => {
    io.sockets.in(roomId).emit('removeBossAttack', data);
  }, (roomId, p) => {
    const player = p;
    player.lastUpdate = new Date().getTime() + 1000;
    io.sockets.in(roomId).emit('updatePlayer', player);
  });

  const spawnQueue = game.getSpawnQueue();

  for (let i = 0; i < spawnQueue.length; i++) {
    spawnBoss(spawnQueue[i]);
    game.spliceSpawnQueue(i);
  }

  // Process attack array
  instanceHandler.processAttacks(players, io);

  // process queue array
  instanceHandler.processQueue(io);

  // server tick of 20
  setTimeout(update, 20);
};

update();

module.exports = {
  init,
};
