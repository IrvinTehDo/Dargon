//Construct the main window (using a given width and height for the canvas)
const GameWindow = (props) => {
  return (
    <div class="container-fluid">
      <div class="row row-centered">
        <div id="gameInfo" class="col-xl-4 col-centered">
        </div>
        
        <div id="viewport-parent" class="col-xl-4 col-centered">
          <canvas id="viewport" width={props.width} height={props.height}></canvas>
          <p>Controls: WASD or Arrow Keys to Move, Space bar or J to attack</p>
          <p>Avoid: Red rectangles, will damage when completely red</p>
          <p>Gather: Gems on boss death (score)</p>
        </div>
        
        <div class="col-xl-4 col-centered">
          <iframe width="560" height="315" 
            src="https://www.youtube.com/embed/videoseries?list=PLbzURmDMdJdPlsSgLqqb3IwnY5A0jWK_q"
            frameBorder="0" allow="autoplay; encrypted-media" id="videoFrame">
          </iframe>
        </div>
      </div>
    </div>
  );
};

//Make a call to render the game window above, and pass in the desired canvas dimensions
const renderGame = (width, height) => {
  ReactDOM.render(
    <GameWindow width={width} height={height} />,
    document.querySelector("#main")
  );
  
  //Hook up the canvas to JS code
  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');
};

//Make a call to render the game info section
const renderGameInfo = (gameInfo) => {
  ReactDOM.render(
    <GameInfo info={gameInfo} />,
    document.querySelector("#gameInfo")
  );
};

//Construct the game info window using the given player and boss info
const GameInfo = (props) => {
  
  //Calculate state variables like button usability and progress bar width
  const disabled = props.info.player.points === 0;
  const expBetweenLevels = props.info.player.nextLevel - props.info.player.prevLevel;
  const expRatio = Math.floor(((props.info.player.exp - props.info.player.prevLevel) / expBetweenLevels) * 100);
  const ratioString = `${expRatio}%`;
  const style = {
    width: ratioString,
  }
  
  //Return the JSX version of the game info
  //*Note: Render changes based on whether the player is alive or dead
  return (
    <div>
      <h1>Game Info</h1>
      <hr />
      <h2 class="text-info">{props.info.player.alive ? "Player Stats" : "Respawn Player"}</h2>
      {props.info.player.alive &&
        <div>
          <p>
            <span>Score (Gems): {props.info.player.gems}</span>
          </p>
          <p>
            <span>Character Points: {props.info.player.points}</span>
          </p>
          <p>
            <span>Max Health: {props.info.player.maxHealth} </span> 
            <button id="increaseHealth" class="levelUpButton btn btn-primary" disabled={disabled} onClick={upgradeChar}>+10 HP</button>
          </p>
          <p>
            <span>Strength: {props.info.player.strength} </span>
            <button id="increaseStrength" class="levelUpButton btn btn-primary" disabled={disabled} onClick={upgradeChar}>+1 Strength</button>
          </p>
          <p>
            <span>Defense: {props.info.player.defense} </span>
            <button id="increaseDefense" class="levelUpButton btn btn-primary" disabled={disabled} onClick={upgradeChar}>+2 Defense</button>
          </p>
          <p>
            <span>Level: {props.info.player.level} (Exp: {props.info.player.exp} / {props.info.player.nextLevel}) </span>
            <div id="levelUpBar" class="progress">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                style={style}
                role="progressbar"
                aria-valuenow={props.info.player.exp}
                aria-valuemin={props.info.player.prevLevel}
                aria-valuemax={props.info.player.nextLevel}
              >
              </div>
            </div>
          </p>
        </div>
      }
      
      {!props.info.player.alive &&
        <button id="respawnButton" class="btn btn-danger" onClick={respawnRequest}>Respawn</button>
      }
      
      <hr />
      <h2 class="text-warning">Boss Bounty</h2>
      <p>
        <span>Boss: {props.info.boss.name}</span>
      </p>
      <p>
        <span>Boss Level: {props.info.boss.level}</span>
      </p>
      <p>
        <span>Exp Reward: {props.info.boss.exp}</span>
      </p>
      <p>
        <span>Gem Reward: {props.info.boss.gems}</span>
      </p>
    </div>
  );
}

//Construct the character selection window
const CharSelect = (props) => {
  
  //Map the characters object into an array
  const charactersArray = Object.keys(props.characters).map((character) => {
    return props.characters[character];
  });
  
  //Return JSX to inform that player that the characters are still loading
  if(charactersArray.length === 0){
    return (
      <div>
        <h2>Loading...</h2>
      </div>
    );
  };
  
  //Construct panels for each returned character (map function creates a new array)
  const charList = charactersArray.map((character) => {
    //Insert values using curly braces
    return (
      <div class="charPreview card border-secondary col">
        <div class="card-header">
          <h2>{character.name}</h2>
        </div>
        <div class="card-body">
          <div class="crop-image">
            <img src={character.imageFile} alt={`${character.name} sprite`} />
          </div>
          <hr />
          <div>
            <h3 class="text-info">Stats</h3>
            <p>Strength: {character.strength}</p>
            <p>Defense: {character.defense}</p>
            <p>Health: {character.maxHealth}</p>
          </div>
          <hr />
          <button class="btn btn-lg btn-secondary charButton" onClick={chooseCharacter} selectid={character.name}>Select</button>
        </div>
      </div>
    );
  });
  
  //Return all of the panels (the passed in array auto formats)
  //*Note: break the characters into groups of 4 to help presentation
  return (
    <div>
      <h2 id="charSelectHeader">Select Your Character</h2>
      
      <hr />
      
      <div class="container-fluid">
        <div class="row row-centered">
          {charList.slice(0, 4)}
        </div>
        <div class="row">
          {charList.slice(4, 8)}
        </div>
      </div>
    </div>
  );
};

//Render the character selection window
const renderCharacterSelect = (chars) => {
  ReactDOM.render(
    <CharSelect characters={chars} />,
    document.querySelector("#main")
  );
};

// Handles join/create room button. Only allows users to join rooms only if they're in the lobby.
const joinRoom = (e, roomName, create) => {
  console.log('join/create req recieved');
  console.log(room.roomJoined);    
  if (room.roomJoined !== 'lobby') {
    e.preventDefault();
    return false;
  }

  if (create) {
    socket.emit('createRoom', roomName);
  } else {
    socket.emit('joinRoom', roomName);
  }

  e.preventDefault();
  return false;
};

// Creates the HTML for the lobby such as room queuing, joining, and creation. Also holds the open room list.
const renderLobby = (rooms) => {
    ReactDOM.render(
        <div id="lobbyContainer" class="container">
            <div id="roomContainer">
                <form id="createRoomForm" class="row row-centered">
                    <p class="col-sm-4 text-centered">
                      <label id="createLabel" for="createRoom">Create Room</label>
                    </p>
                    <p class="col-sm-3">
                      <input class="form-control" id="createRoomField" type="text" name="createRoom" maxlength="4" size="4"></input>
                    </p>
                    <p class="col-sm-3">
                      <input class="input-group-btn btn btn-success" type="submit" value="Create Room"></input>
                    </p>
                </form>
                <form id="joinRoomForm" class="row row-centered">
                    <p class="col-sm-4 text-centered">
                      <label id="joinLabel" for="joinRoom">Join a Room</label>
                    </p>
                    <p class="col-sm-3">
                      <input class="form-control" id="joinRoomField" type="text" name="joinRoom" maxlength="4" size ="4"></input>
                    </p>
                    <p class="col-sm-3">
                      <input class="input-group-btn btn btn-info" type="submit" value="Join Room"></input>
                    </p>
                </form>
            </div>
            <div class="row row-centered">
              <div class="col-sm-4"></div>
              <section id="queueNumber" class="col-sm-4 col-centered"> </section>
              <div class="col-sm-4"></div>
            </div>
            <div id="queueContainer" class="row row-centered">
                <div class="col-sm-4"></div>
                <button id="queue" class="btn btn-info text-centered col-sm-4 col-centered" onClick={queue}>Queue!</button>
                <div class="col-sm-4"></div>
            </div>
            <div id="roomList" class="row row-centered">
            </div>
        </div>,
        document.querySelector("#main")
    ); 
                        
  const createRoomForm = document.querySelector('#createRoomForm');
  const sendCreateReq = e => joinRoom(e, createRoomForm.querySelector('#createRoomField').value, true);
  createRoomForm.addEventListener('submit', sendCreateReq);

  const joinRoomForm = document.querySelector('#joinRoomForm');
  const sendJoinReq = e => joinRoom(e, joinRoomForm.querySelector('#joinRoomField').value, false);
  joinRoomForm.addEventListener('submit', sendJoinReq);    
    
   socket.emit('requestOpenRoomList');
};

// Handles error emition.
const emitError = (error) => {
    const errorContainer = document.querySelector("#error");
    errorContainer.classList.remove("hidden");
    
    // Message will hide after 3 seconds.
    setTimeout(() => {
      errorContainer.classList.add("hidden");
    }, 3000);
    
    errorContainer.innerHTML = error;
};

// Creates the room box for when we look for open rooms that are joinable. 
const makeRoomBox = (roomData) => {
    console.dir(roomData);
    console.log(roomData.roomName);
    const roomBox = document.createElement('div');
    const innerRoomBox = document.createElement('div');
    innerRoomBox.className = "card roomBox border-light";
    roomBox.appendChild(innerRoomBox);
    roomBox.className = "col-sm-4 col-centered";
    const roomName = document.createElement('h3');
    roomName.className = 'card-header';
    roomName.innerHTML = roomData.roomName;
    
    const playerKeys = Object.keys(roomData.players);
    
    const count = document.createElement('p');
    count.innerHTML = `Players: ${playerKeys.length}/8`;
    count.className = 'card-body';
    const button = document.createElement('button');
    button.innerHTML = 'Join Room';
    button.className = 'btn btn-lg btn-info';
    button.onclick = () => {
        requestToJoinRoom(roomData.roomName);
    };
    
    innerRoomBox.appendChild(roomName);
    innerRoomBox.appendChild(count);
    innerRoomBox.appendChild(button);
    return roomBox;
};

// Calls for makeRoomBox and appends open rooms to a larger 
// container for the client to choose which open room to join.
const renderAvailableRooms = (rooms) => {
    const roomList = document.querySelector('#roomList');
    roomList.innerHTML = "";
    const roomKeys = Object.keys(rooms);
    console.dir(rooms);
    for(let i = 0; i < roomKeys.length; i++) {
        if(!(rooms[roomKeys[i]].roomName === 'lobby')) {
            roomList.appendChild(makeRoomBox(rooms[roomKeys[i]]));
        }
    }
};

