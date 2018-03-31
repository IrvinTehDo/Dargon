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

const aggregateGameInfo = () => {
  const player = players[hash];
  let bossDetails = {};
 
  if(boss && boss.alive){
    bossDetails = {
      name: boss.name,
      level: boss.level,
      exp: boss.exp,
      gems: boss.gems,
    };
  } else {
    bossDetails = {
      name: "N/A",
      level: "N/A",
      exp: "N/A",
      gems: "N/A",
    };
  }
  
  const info = {
    player: {
      maxHealth: player.maxHealth,
      strength: player.strength,
      defense: player.defense,
      level: player.level,
      exp: player.exp,
      gems: player.gems,
      prevLevel: player.prevLevel,
      nextLevel: player.nextLevel,
      points: player.pointsToAllocate,
    },
    boss: bossDetails,
  };
  
  console.log(info);
  
  return info;
}

const setPlayer = (data) => {
  
  hash = data.hash;
  players[hash] = data;
  players[hash].room = room.roomJoined;
  
  
  renderGame(600, 600, info);
  const info = aggregateGameInfo();
  renderGameInfo(info);

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(update);
  }
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

  let flagToReRenderInfo = false;
  if(player.exp != data.exp || player.pointsToAllocate != data.pointsToAllocate || player.gems || data.gems){
    flagToReRenderInfo = true;
  }
  
  // Player specific updates
  player.currentHealth = data.currentHealth;
  player.maxHealth = data.maxHealth;
  player.strength = data.strength;
  player.defense = data.defense;
  player.level = data.level;
  player.exp = data.exp;
  player.prevLevel = data.prevLevel;
  player.nextLevel = data.nextLevel;
  player.pointsToAllocate = data.pointsToAllocate;
  player.gems = data.gems;
  
  if(flagToReRenderInfo){
    const info = aggregateGameInfo();
    renderGameInfo(info);
  }
  
  //Don't update movement or animations if the update is about this player
  if (hash === data.hash) {
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
  const info = aggregateGameInfo();
  renderGameInfo(info);
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

const bossDeath = () => {
  boss.anim = boss.ANIMS.death;
  boss.alive = false;
  damageAreas = {};
  const info = aggregateGameInfo();
  renderGameInfo(info);
};

const upgradeChar = (e) => {
  const id = e.target.getAttribute("id");
  switch(id){
    case "increaseHealth":
      socket.emit('characterUpgrade', {upgrade: 'health'});
      break;
    case "increaseStrength":
      socket.emit('characterUpgrade', {upgrade: 'strength'});
      break;
    case "increaseDefense":
      socket.emit('characterUpgrade', {upgrade: 'defense'});
      break;
  }
};

const dispenseGems = (data) => {
  const gemCount = data.gems;
  
  for(let i = 0; i < gemCount; i++){
    const randAngle = Math.random() * 360;
    const radian = (randAngle * Math.PI) / 180;
    const speed = 20 * Math.random() + 2;
    const vector = {
      x: Math.sin(radian) * speed,
      y: Math.cos(radian) * speed,
    }
    const sprite = Math.floor(Math.random() * 4);
    
    const gem = {
      x: boss.x,
      y: boss.y,
      ticks: 0,
      activateMagnet: 200,
      radian,
      speed,
      vector,
      sprite,
    }
    
    gems.push(gem);
  }
};

const collectGem = () => {
  socket.emit('collectGem');
};
