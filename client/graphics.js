//Grab the boss spritesheets
const bossImageStruct = {
	"dragon": document.querySelector("#dragonBoss")
};

let characterImageStruct = {};

const damageAreas = {};
const gems = [];

//Function that lerps between two given points using the provided ratio
const lerp = (pos1, pos2, ratio) => {
  const component1 = (1 - ratio) * pos1;
  const component2 = ratio * pos2;
  return component1 + component2;
};

//Draw the scene to the canvas
const draw = () => {
  //Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  //Draw background
  ctx.drawImage(dungeonFloor, 0, 0, canvas.width, canvas.height);
  
  // Draw code
  const playerKeys = Object.keys(players);
  frameCounter++;
  
  //Draw all of the damage areas
  const damageAreaKeys = Object.keys(damageAreas);
  for(let i = 0; i < damageAreaKeys.length; i++){
    drawDamageArea(damageAreas[damageAreaKeys[i]]);
  }
  
  //Draw all of the gems
  drawAndUpdateGems();

  //Iterate over the players in the room
  for (let i = 0; i < playerKeys.length; i++) {
    const player = players[playerKeys[i]];

    //Update the position ratio for lerping
    if (player.ratio < 1) {
      player.ratio += 0.05;
    }

    ctx.save();

    //Calculate the new player position
    player.x = lerp(player.prevX, player.destX, player.ratio);
    player.y = lerp(player.prevY, player.destY, player.ratio);

    //If it's time to advance the current animation's frame
    if (frameCounter % player.anim.speed === 0) {
      //If it's looping, wrap the frame, otherwise stop at the last frame
      if (player.anim.loop === true) {
        player.frame = (player.frame + 1) % player.anim.frameCount;
      } else if (player.frame < player.anim.frameCount - 1) {
        player.frame++;
      } else if (player.attacking) {
        //if the player was attacking, reset them
        player.attacking = false;
        switchAnimation(player, "meditate");
      }
    }
    
    //If the player is dead,
    if(!player.alive){
      //Switch the animation to 'death'
      if(player.anim.row !== 20){
        switchAnimation(player, 'death');
        player.direction = player.DIRECTIONS.up;
      }
    }

    //If the player's image has loaded
    if (characterImageStruct[player.name]) {
      //If the player is attacking draw them using their attack dimensions
      if (player.attacking) {
        ctx.drawImage(
          characterImageStruct[player.name],
          player.attWidth * player.frame,
          (player.anim.row * player.height) + (player.direction * player.attHeight),
          player.attWidth,
          player.attHeight,
          player.x - (player.attWidth / 2),
          player.y - (player.attHeight / 2),
          player.attWidth,
          player.attHeight,
        );
      //If the player isn't attacking draw them using their normal dimensions
      } else {
        ctx.drawImage(
          characterImageStruct[player.name],
          player.width * player.frame,
          player.height * (player.anim.row + player.direction),
          player.width,
          player.height,
          player.x - (player.width / 2),
          player.y - (player.height / 2),
          player.width,
          player.height
        );
      }
      
      //If the player is alive, draw their health bar
      if(player.alive){
        drawHealthBar(player.x, player.y, player.currentHealth, player.maxHealth);
      }
    }

    ctx.restore();
  }
  
  //Draw the boss
  if(boss){
    
    //Calculate the boss's new position
    boss.x = lerp(boss.prevX, boss.destX, boss.ratio);
    boss.y = lerp(boss.prevY, boss.destY, boss.ratio);
    
    //If the boss needs to advance it's frame, do so
    if(frameCounter % boss.anim.speed === 0){
      if(boss.anim.loop === true){
        boss.frame = (boss.frame + 1) % boss.anim.frameCount;
      } else if (boss.frame < boss.anim.frameCount - 2){
        boss.frame++;
      }
    }
    
    //Alter the bosses color and draw it
    ctx.save();
    ctx.globalAlpha = boss.opacity;
    ctx.filter = `hue-rotate(${boss.hueRotate}deg)`;
    ctx.drawImage(
      bossImageStruct[boss.sprite],
      boss.width * boss.frame,
      boss.height * (boss.anim.row + boss.direction),
      boss.width,
      boss.height,
      boss.x - (boss.width / 2),
      boss.y - (boss.height / 2),
      boss.width,
      boss.height
    );
    ctx.restore();
    
    //If the boss is dead, fade it out over time, otherwise draw the health bar
    if(!boss.alive){
      boss.opacity -= 0.005;
      boss.opacity = Math.max(0, boss.opacity);
    } else {
      drawHealthBar(boss.x, boss.y, boss.currentHealth, boss.maxHealth);
    }
  }
};

//Switches a player's animation to the given animation
const switchAnimation = (player, animation) => {
  //Only switch if the player's current animation doesn't match
  if (player.anim.row != player.ANIMS[animation].row) {
    //Reset the player's frame and switch the animation
    player.frame = 0;
    player.anim = player.ANIMS[animation];
  }
};

//Draw the a health bar at the given location
const drawHealthBar = (x, y, health, maxHealth) => {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.drawImage(
    healthContainer,
    x - healthContainer.width / 2,
    y + healthContainer.height,
  );
  //Draw the green part of the health bar as a ratio of current health to max health
  ctx.drawImage(
    healthBar,
    0,
    0,
    healthBar.width * (health / maxHealth),
    healthBar.height,
    x - (healthBar.width / 2),
    y + healthContainer.height + 8,
    healthBar.width * (health / maxHealth),
    healthBar.height
  );
  ctx.restore();
};

//Draw a damage area
const drawDamageArea = (damageArea) => {
  //Configure the canvas and draw the outline of the damage area
  ctx.save();
  ctx.globalAlpha = damageArea.status.opacity;
  ctx.fillStyle = "red";
  ctx.strokeStyle = "red";
  ctx.font = "60px maras_eyeregular";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.strokeRect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  
  //Create a canvas clip that will stop the draw call from exceeding the bounds of the box
  ctx.beginPath();
  ctx.rect(damageArea.dimensions.x, damageArea.dimensions.y, damageArea.dimensions.w, damageArea.dimensions.h);
  ctx.clip();
  
  const textHeight = 40;
  let currentY = 0;
  let currentPhraseIndex = 0;
  
  ctx.globalAlpha = ctx.globalAlpha + 0.2;
  
  //Completely fill the box with arcane script
  while(currentY + textHeight < damageArea.dimensions.h + textHeight){
    ctx.save();
    const currentPhrase = damageArea.phrases[currentPhraseIndex];
    
    let x = damageArea.dimensions.x + currentPhrase.textOffset;
    let y = damageArea.dimensions.y + currentY + textHeight / 2; 
    
    const width = ctx.measureText(currentPhrase.text).width;
    
    //Reverse the text if the speed is negative
    if(currentPhrase.speed < 0){
      ctx.translate(x + damageArea.dimensions.w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }
    
    ctx.fillText(currentPhrase.text, x, y);
    
    //Repeate the phrase until the edge of the box is met
    while(x + width < damageArea.dimensions.x + damageArea.dimensions.w){
      x += width;
      ctx.fillText(currentPhrase.text, x, y);
    }
    
    currentPhrase.textOffset -= currentPhrase.speed;
    
    if(Math.abs(currentPhrase.textOffset) >= width){
      currentPhrase.textOffset = 0;
    }
    
    //Move to the next phrase
    currentPhraseIndex = (currentPhraseIndex + 1) % damageArea.phrases.length;
    currentY += textHeight;
    
    ctx.restore();
  }
  
  //Grow the box a little bit (until it reaches full size)
  damageArea.growBox(4);
  
  ctx.restore();
};

//Draw and update the gems
const drawAndUpdateGems = () => {
  //Iterate over the gems
  for(let i = 0; i < gems.length; i++){
    const gem = gems[i];
    
    //Update the gem's position
    gem.x += gem.vector.x;
    gem.y += gem.vector.y;
    
    gem.ticks++;
    
    //If enough time has passed, activate the gem's "magnet" feature
    if(gem.ticks >= gem.activateMagnet){
      
      //Move towards the player
      const player = players[hash];
      const distX = gem.x - player.x;
      const distY = gem.y - player.y;
      const magnitude = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
      
      //If within range, have the player collect the gem
      if(Math.abs(distX) < 40 && Math.abs(distY) < 40){
        collectGem();
        gems.splice(i, 1);
        i--;
        continue;
      }
      
      gem.vector = {
        x: -distX / magnitude,
        y: -distY / magnitude,
      };
    } else if (gem.ticks < gem.activateMagnet){
      //Slow the gem down
      gem.vector = {
        x: gem.vector.x * 0.98,
        y: gem.vector.y * 0.98,
      };
    }
    
    //Keep the gem within the bounds of the canvas
    if(gem.x < 0){
      gem.vector.x *= -1;
      gem.x = 0;
    } else if(gem.x > canvas.width - 25){
      gem.vector.x *= -1;
      gem.x = canvas.width - 25;
    }
    
    if(gem.y < 0){
      gem.vector.y *= -1;
      gem.y = 0;
    } else if(gem.y > canvas.height - 25){
      gem.vector.y *= -1;
      gem.y = canvas.height - 25;
    }
    
    //Draw the gem (4 gems on the spritesheet)
    const gemSpriteX = 125 * (gem.sprite % 2);
    const gemSpriteY = 125 * Math.floor(gem.sprite / 2);
    
    ctx.drawImage(
      gemSprite,
      gemSpriteX,
      gemSpriteY,
      125,
      125,
      gem.x,
      gem.y,
      25,
      25
    );
  }
};