const xxh = require('xxhashjs');
const physics = require('./physics');

let io;

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

    // socket.on('custom-event', (data) => {});

    // Placeholder
    socket.on('collision-check', (data) => {
      physics.collision.AABB(data.rect1, data.rect2);
    });

    socket.on('disconnect', () => {
      socket.leave(socket.roomJoined);
    });
  });
};

module.exports = {
  init,
};
