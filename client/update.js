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
  } else {
    switchAnimation(player, 'attack');
  }
  
  player.ratio = 0.05;
  socket.emit('playerMovement', player);
};

const handleChars = (data) => {
  //Load character files into memory for later usage
  const charKeys = Object.keys(data);
  for(let i = 0; i < charKeys.length; i++){
    const character = data[charKeys[i]];
    
    const charImage = new Image();
    
    charImage.onload = () => {
      characterImageStruct[charKeys[i]] = charImage;
    }
    
    charImage.src = character.imageFile;
  }
  
  renderCharacterSelect(data);
}

const chooseCharacter = (e) => {
  socket.emit('chooseCharacter', {id: e.target.getAttribute('selectid')});
};

const handleLobby = (data) => {
    room.roomJoined = 'lobby';
    renderLobby(data);
};


const setPlayer = (data) => {
  
  renderGame(600, 600);
  
  hash = data.hash;
  players[hash] = data;
  players[hash].room = room.roomJoined;    

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
    players[data.hash] = data;
  }

  if (players[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  const player = players[data.hash];

  if (hash === data.hash) {
    // Player specific updates
    player.currentHealth = data.currentHealth;
    return;
  }
  
  player.currentHealth = data.currentHealth;
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
  player.attacking = data.attacking;
  player.lastUpdate = data.lastUpdate;
  
  if(player.attacking){
    switchAnimation(player, "attack");
  }
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

const updateBossAttack = (data) => {
  const progress = data.progress / data.complete;
  if(!damageAreas[data.id]){
    damageAreas[data.id] = new DamageArea({x: data.x, y: data.y, w: data.w, h: data.h}, progress);
  } else {
    damageAreas[data.id].update(progress);
  }
};

const removeBossAttack = (data) => {
  if(damageAreas[data.id]){
    damageAreas[data.id] = undefined;
    delete damageAreas[data.id];
  }
};
