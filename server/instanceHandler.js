const rooms = {};

const setUpLobby = () => {
  rooms.lobby = {};
  rooms.lobby.roomName = 'lobby';
  rooms.lobby.players = {};
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

module.exports = {
  rooms,
  setUpLobby,
  roomInit,
  roomJoin,
};
