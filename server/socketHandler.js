const xxh = require('xxhashjs');

const child = require('child_process');

const classes = require('./classes');

const { Character } = classes;
// const { Message } = classes;

const players = {};

let io;

const physics = child.fork('./server/physics');

// Attach custom socket events
const init = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (sock) => {
    const socket = sock;

    // One room or multiple?
    socket.join('room');
    socket.roomJoined = 'room';

    const time = new Date().getTime();
    const hash = xxh.h32(`${socket.id}${time}`, 0x010A020B).toString(16);

    socket.hash = hash;

    players[hash] = new Character(hash, 20, 20);

    socket.emit('setPlayer', players[hash]);

    socket.on('playerMovement', (data) => {
      // Should change to a setter that validates data and moves to the existing class!
      players[socket.hash] = data;

      players[socket.hash].lastUpdate = new Date().getTime();
      io.sockets.in(socket.roomJoined).emit('updatePlayer', players[socket.hash]);
    });

    socket.on('sendAttack', (data) => {
      io.sockets.in(socket.roomJoined).emit('receiveAttack', data);
    });

    // socket.on('custom-event', (data) => {});


    // Placeholder
    socket.on('collision-check', (data) => {
      physics.collision.AABB(data.rect1, data.rect2);
    });

    socket.on('disconnect', () => {
      io.sockets.in(socket.roomJoined).emit('deletePlayer', players[socket.hash]);
      players[socket.hash] = undefined;
      delete players[socket.hash];
      socket.leave(socket.roomJoined);
    });
  });
};

module.exports = {
  init,
};
