const xxh = require('xxhashjs');

const child = require('child_process');

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

const physics = child.fork('./server/physics');

// Attach custom socket events
const init = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (sock) => {
    const socket = sock;

    const time = new Date().getTime();
    const hash = xxh.h32(`${socket.id}${time}`, 0x010A020B).toString(16);

    socket.hash = hash;

    // One room or multiple?
    socket.join('lobby');
    socket.roomJoined = 'lobby';
    instanceHandler.roomJoin('lobby', socket);

    // socket.emit('joined', socket.roomJoined);

    socket.on('getChars', () => {
      socket.emit('availableChars', game.getAvailableChars());
    });

    socket.on('chooseCharacter', (data) => {
      if (game.validateChar(data.id)) {
        const character = game.getChar(data.id);
        players[hash] = new Character(character.name, hash, 20, 20);
        // socket.emit('setPlayer', players[hash]);
        socket.emit('moveToLobby');
      }
    });

    socket.on('requestCharacterData', () => {
      socket.emit('setPlayer', players[hash]);

      if (!game.hasBoss(socket.roomJoined)) {
        game.spawnBoss(socket.roomJoined, (boss) => {
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

      for (let i = 0; i < playerAttributesToCopy.length; i++) {
        const key = playerAttributesToCopy[i];
        player[key] = data[key];
      }

      player.lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', player);
    });

    socket.on('sendAttack', (data, roomName) => {
      instanceHandler.addAttack(roomName, data);
      console.log(`attack recieved from ${roomName}`);
      // io.sockets.in(socket.roomJoined).emit('receiveAttack', data);
    });

    // socket.on('custom-event', (data) => {});

    // create and join
    socket.on('createRoom', (roomName) => {
      if (instanceHandler.roomInit(roomName, socket)) {
        if (instanceHandler.roomJoin(roomName, socket)) {
          if (socket.roomJoined === 'lobby') {
            delete instanceHandler.rooms.lobby.players[socket.hash];
            delete instanceHandler.rooms.lobby.players[socket.hash];
          } else {
            delete instanceHandler.rooms[socket.roomJoined].players[socket.hash];
          }
          socket.roomJoined = roomName;
          // To Do: Remove player/socket from other instance/room and move them to the new one.
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
          delete instanceHandler.rooms.lobby.players[socket.hash];
        } else {
          delete instanceHandler.rooms[socket.roomJoined].players[socket.hash];
        }
        socket.roomJoined = roomName;
        // To Do: Remove player/socket from other instance/room and move them to the new one.

        socket.emit('joined', roomName);
        console.log('joined room');
      }
    });

    // Placeholder
    socket.on('collision-check', (data) => {
      physics.collision.AABB(data.rect1, data.rect2);
    });


    // Moved to socket.on('requestCharacterData')

    //    if (!game.hasBoss(socket.roomJoined)) {
    //      game.spawnBoss(socket.roomJoined, (boss) => {
    //        console.log(`spawned boss in ${socket.roomJoined}`);
    //        instanceHandler.rooms[socket.roomJoined].enemies[boss.sprite] = boss;
    //        io.sockets.in(socket.roomJoined).emit('spawnBoss', boss);
    //      });
    //    } else {
    //      socket.emit('spawnBoss', game.getBoss(socket.roomJoined));
    //    }

    socket.on('disconnect', () => {
      io.sockets.in(socket.roomJoined).emit('deletePlayer', players[socket.hash]);
      players[socket.hash] = undefined;
      delete players[socket.hash];
      socket.leave(socket.roomJoined);
    });
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
  }, (roomId, player) => {
    io.sockets.in(roomId).emit('updatePlayer', player);
  });

  // 'lobby' is temporary, should be replaced with roomName.
  instanceHandler.processAttacks(io);

  setTimeout(update, 20);
};

update();

module.exports = {
  init,
};
