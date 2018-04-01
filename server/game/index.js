// Import custom classes
const classes = require('./../classes');

// Import character templates
const charTemplates = require('./charTemplates');

// Import the physics module
const physics = require('./../physics/index.js');

// Getters, validators, and setters for usage outside of the game structure
const getAvailableChars = () => charTemplates;
const validateChar = id => charTemplates[id] !== undefined;
const getChar = id => charTemplates[id];

// Variables for usage in the main game structure
const { Dragon } = classes;
const bosses = {};
const spawnQueue = [];
let prevAttackTime = new Date().getTime();

// More getters, validators, and setters
const hasBoss = roomId => bosses[roomId] !== undefined;
const getBoss = roomId => bosses[roomId].being;
const getSpawnQueue = () => spawnQueue;
const spliceSpawnQueue = i => spawnQueue.splice(i, 1);

// This function determines the combined level of all players in a room
const calcAggregateLevel = (players, roomHashes) => {
  let level = 0;

  // Add all player levels in the given room
  const playerHashes = Object.keys(roomHashes);
  for (let i = 0; i < playerHashes.length; i++) {
    const player = players[playerHashes[i]];
    level += player.level;
  }

  return level;
};

// Process a boss death event
const bossDeath = (roomId, players, playerHashes, io) => {
  // Determine exp and gems rewards
  const boss = bosses[roomId].being;
  const { exp } = boss;
  const { gems } = boss;
  const hashes = Object.keys(playerHashes);

  // Iterate over all players in the room with the boss
  for (let i = 0; i < hashes.length; i++) {
    const player = players[hashes[i]];

    // Give the player exp and gems to collect
    player.exp += exp;
    player.gemsToCollect = gems;

    // Level up the player if their exp is high enough
    while (player.exp >= player.nextLevel) {
      // Give the player upgrade points, configure their next exp goal and heal them
      player.level++;
      player.pointsToAllocate += 2;
      player.prevLevel = player.nextLevel;
      player.nextLevel = Math.floor(player.nextLevel * 2.2);
      player.currentHealth = player.maxHealth;
    }

    // Tell all clients in the room to update this player
    player.lastUpdate = new Date().getTime();
    io.sockets.in(roomId).emit('updatePlayer', player);
  }

  // Tell all sockets in the room to kill the boss and dispense gems
  io.sockets.in(roomId).emit('bossDeath');
  io.sockets.in(roomId).emit('dispenseGems', { gems: boss.gems });

  // Delete the boss
  delete bosses[roomId];

  // In 5 seconds, spawn a new boss
  setTimeout(() => {
    spawnQueue.push(roomId);
  }, 5000);
};

// Process damage dealt to a boss
const takeDamage = (roomId, damage, players, playerHashes, io) => {
  // If the boss doesn't exist, don't update
  if (!bosses[roomId]) {
    return;
  }

  // Damage the boss
  bosses[roomId].being.currentHealth -= damage;

  // Update all players in the room
  io.sockets.in(roomId).emit('updateBoss', { currentHealth: bosses[roomId].being.currentHealth });

  // If the boss is now dead, process its death
  if (bosses[roomId].being.currentHealth <= 0) {
    bossDeath(roomId, players, playerHashes, io);
  }
};

// Generate stats for a new boss based on its level
const generateBossStats = (lvl) => {
  const level = lvl;
  return {
    level,
    health: level * 10,
    strength: level * 2,
    defense: level,
    speed: Math.min(level / 2, 10),
    attackSpeed: Math.max(1, 6 - (level / 10)),
  };
};

// Spawn a new boss into a room
const spawnBoss = (roomId, level, callback) => {
  const randX = Math.floor(Math.random() * 200) + 96;
  const randY = Math.floor(Math.random() * 200) + 96;

  // Create a new boss (just dragons for now) and attack meta data
  bosses[roomId] = {
    being: new Dragon(
      { x: randX, y: randY },
      generateBossStats(level),
      roomId,
    ),
    targetLoc: undefined,
    idleTicks: 0,
    targetIdleTicks: 0,
    attackTicks: 0,
    attacks: [],
    attacksToResolve: [],
  };

  // Notify players in the room to spawn the boss
  callback(getBoss(roomId));
};

// Give a boss a new target location
const assignTargetLoc = (bossObj) => {
  const boss = bossObj;

  // Reset the idle timer
  boss.idleTicks = 0;
  boss.targetIdleTicks = Math.floor(Math.random() * boss.being.maxIdleTicks);

  // Randomly assign a new location
  boss.targetLoc = {
    x: Math.floor(Math.random() * 400) + 96,
    y: Math.floor(Math.random() * 400) + 96,
  };

  const xDiff = boss.being.x - boss.targetLoc.x;
  const yDiff = boss.being.y - boss.targetLoc.y;

  // Determine the boss's direction based off of distance in the x and y direction
  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    boss.being.direction = xDiff > 0 ? boss.being.DIRECTIONS.left : boss.being.DIRECTIONS.right;
  } else {
    boss.being.direction = yDiff > 0 ? boss.being.DIRECTIONS.up : boss.being.DIRECTIONS.down;
  }
};

// Create an attack for a boss
const spawnBossAttack = (bossKey) => {
  // Draft a randomly placed / size box
  const randX = Math.floor(Math.random() * 400);
  const randWidth = Math.floor(Math.random() * 150) + 50;

  const randY = Math.floor(Math.random() * 400);
  const randHeight = Math.floor(Math.random() * 150) + 50;

  // Construct a new attack
  const attack = {
    id: `${new Date().getTime()}${bosses[bossKey].attacks.length}`,
    x: randX,
    y: randY,
    w: randWidth,
    h: randHeight,
    progress: 0,
    complete: 3000,
  };

  // Add the attack to the list of this boss's attacks
  bosses[bossKey].attacks.push(attack);
};

// Update all bosses (in every room)
const updateBosses = (callback) => {
  const bossKeys = Object.keys(bosses);

  for (let i = 0; i < bossKeys.length; i++) {
    const bossObj = bosses[bossKeys[i]];
    const boss = bossObj.being;

    // Determine if it's time for the boss to attack, and spawn an attack if necessary
    bossObj.attackTicks++;
    if (bossObj.attackTicks >= boss.attackFreq) {
      bossObj.attackTicks = 0;
      spawnBossAttack(bossKeys[i]);
    }

    // If the boss no longer has a target location and has expired it's idle timer,
    // assign a new target location
    if (!bossObj.targetLoc) {
      if (bossObj.idleTicks >= bossObj.targetIdleTicks) {
        assignTargetLoc(bossObj);
      } else {
        bossObj.idleTicks++;
      }
    } else {
      // Calcualte the boss's new postion based on their target location and speed
      boss.prevX = boss.x;
      boss.prevY = boss.y;

      const xDiff = bossObj.targetLoc.x - boss.x;
      const yDiff = bossObj.targetLoc.y - boss.y;

      if (Math.abs(xDiff) >= boss.speed) {
        boss.x += xDiff >= 0 ? boss.speed : -boss.speed;
      } else {
        boss.x = bossObj.targetLoc.x;
      }

      if (Math.abs(yDiff) >= boss.speed) {
        boss.y += yDiff >= 0 ? boss.speed : -boss.speed;
      } else {
        boss.y = bossObj.targetLoc.y;
      }

      boss.ratio = 0.05;

      // If the boss has reached their target, update the animation and remove target location
      if (xDiff === 0 && yDiff === 0) {
        boss.anim = boss.ANIMS.idle;
        bossObj.targetLoc = undefined;
      } else {
        boss.anim = boss.ANIMS.walk;
      }

      // Send an update to all players in the room regarding the boss
      callback(boss.room, {
        prevX: boss.prevX,
        prevY: boss.prevY,
        destX: boss.x,
        destY: boss.y,
        anim: boss.anim,
        direction: boss.direction,
        ratio: boss.ratio,
      });
    }
  }
};

// Update all currently live boss attacks
const updateBossAttacks = (callback) => {
  const bossKeys = Object.keys(bosses);

  const currentTime = new Date().getTime();
  const timePassed = currentTime - prevAttackTime;
  prevAttackTime = currentTime;

  for (let i = 0; i < bossKeys.length; i++) {
    const boss = bosses[bossKeys[i]];

    for (let j = 0; j < boss.attacks.length; j++) {
      const attack = boss.attacks[j];
      attack.progress += timePassed;

      // Update all players in the room regarding the boss's attack
      callback(boss.being.room, attack);

      // If the attack is complete, add it to the list of attacks to be resolved
      if (attack.progress > attack.complete) {
        boss.attacksToResolve.push(attack);
        boss.attacks.splice(j, 1);
      }
    }
  }
};

// Calculate the amount of damage dealt to an entity
const calcDamage = (attacker, receiver) => {
  // Damage is equal to the attacker's strength minus the defender's defense,
  // but is always at least one
  const damage = attacker.strength - receiver.defense;
  return Math.max(damage, 1);
};

// Process boss attacks that are ready to be resolved
const resolveBossAttacks = (players, rooms, removeAttack, updatePlayer) => {
  const bossKeys = Object.keys(bosses);

  for (let i = 0; i < bossKeys.length; i++) {
    const boss = bosses[bossKeys[i]];
    const { room } = boss.being;
    const socketIds = Object.keys(rooms[room].players);

    for (let j = 0; j < boss.attacksToResolve.length; j++) {
      const attack = boss.attacksToResolve[j];

      for (let k = 0; k < socketIds.length; k++) {
        const player = players[socketIds[k]];

        // If the player exists
        if (player) {
          // Determine if they were hit when the attack dealt damage
          const hit = physics.checkHitPlayer(
            {
              x: attack.x, y: attack.y, width: attack.w, height: attack.h,
            },
            {
              x: player.x - (player.width / 2),
              y: player.y - (player.height / 2),
              width: player.width,
              height: player.height,
            },
          );

          // If the player is alive and was hit
          if (hit && player.alive) {
            // Apply damage to the player
            const damage = calcDamage(boss.being, player);
            player.currentHealth -= damage;

            // If the player has reached 0 health, they are dead
            if (player.currentHealth <= 0) {
              player.alive = false;
            }

            // Update the room with the player's current status
            updatePlayer(room, player);
          }
        }
      }

      removeAttack(room, attack);
      boss.attacksToResolve.splice(j, 1);
      j--;
    }
  }
};

// Process a client request to upgrade their character
const upgradePlayer = (p, upgrade, callback) => {
  const player = p;
  // Depending on the requested upgrade, augment their stats (default is health)
  switch (upgrade) {
    case 'health':
      player.currentHealth += 10;
      player.maxHealth += 10;
      break;
    case 'strength':
      player.strength += 1;
      break;
    case 'defense':
      player.defense += 2;
      break;
    default:
      player.currentHealth += 10;
      player.maxHealth += 10;
      break;
  }

  // Update all players in the room about this upgrade
  callback(player);
};

module.exports = {
  hasBoss,
  getBoss,
  getSpawnQueue,
  spliceSpawnQueue,
  calcDamage,
  calcAggregateLevel,
  takeDamage,
  spawnBoss,
  updateBosses,
  updateBossAttacks,
  resolveBossAttacks,
  getAvailableChars,
  validateChar,
  getChar,
  upgradePlayer,
};
