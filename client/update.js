const update = () => {
  // Update code
  updateLocalPosition();
  draw();

  animationFrame = requestAnimationFrame(update);
};

const updateLocalPosition = () => {
  const player = players[hash];

  player.prevX = player.x;
  player.prevY = player.y;

  if (player.moveLeft && player.x >= 2) {
    player.destX -= 2;
    player.direction = player.DIRECTIONS.left;
  }

  if (player.moveRight && player.x <= canvas.width - player.width - 2) {
    player.destX += 2;
    player.direction = player.DIRECTIONS.right;
  }

  if (player.moveUp && player.y >= 2) {
    player.destY -= 2;
    player.direction = player.DIRECTIONS.up;
  }

  if (player.moveDown && player.y <= canvas.height - player.height - 2) {
    player.destY += 2;
    player.direction = player.DIRECTIONS.down;
  }

  if (!player.attacking) {
    if (player.moveUp || player.moveDown || player.moveLeft || player.moveRight) {
      switchAnimation(player, 'walk');
    } else {
      switchAnimation(player, 'meditate');
    }
  }


  player.ratio = 0.05;
  socket.emit('playerMovement', player);
};

const setPlayer = (data) => {
  hash = data.hash;
  players[hash] = data;

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }

  console.log(players[hash]);
};

const sendAttack = () => {
  const player = players[hash];

  const attack = {
    hash,
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height,
  };
  socket.emit('sendAttack', attack, player.room);
};

const receiveAttack = (data) => {
  if (players[data.hash]) {
    players[data.hash].attacking = true;
    switchAnimation(players[data.hash], 'attack');
  }
};

const updatePlayer = (data) => {
  if (!players[data.hash]) {
    players[data.hash] = new Character(data.hash);
  }

  if (players[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  const player = players[data.hash];

  if (hash === data.hash) {
    // Player specific updates
    return;
  }

  player.prevX = data.prevX;
  player.prevY = data.prevY;
  player.destX = data.destX;
  player.destY = data.destY;
  player.anim = data.anim;
  player.direction = data.direction;
  player.ratio = data.ratio;
  player.moveUp = data.moveUp;
  player.moveDown = data.moveDown;
  player.moveLeft = data.moveLeft;
  player.moveRight = data.moveRight;
  player.lastUpdate = data.lastUpdate;
};

const deletePlayer = (data) => {
  if (players[data.hash]) {
    delete players[data.hash];
  }
};

const disconnect = () => {
  if (hash) {
    cancelAnimationFrame(animationFrame);
    delete players[hash];
    animationFrame = undefined;
  }
};

const spawnBoss = (data) => {
  boss = data;
};

const updateBoss = (data) => {
  if (!boss) {
    return;
  }

  const keys = Object.keys(data);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    boss[key] = data[key];
  }
};
