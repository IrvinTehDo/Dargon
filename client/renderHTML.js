//Construct the main window (using a given width and height for the canvas)
const GameWindow = (props) => {
  return (
    <div>
      <iframe width="560" height="315" 
        src="http://www.youtube.com/embed/videoseries?list=PLbzURmDMdJdPlsSgLqqb3IwnY5A0jWK_q"
        frameBorder="0" allow="autoplay; encrypted-media" id="videoFrame">
      </iframe>
      
      <canvas id="viewport" width={props.width} height={props.height}></canvas>
    </div>
  );
};

//Make a call to render the game window above, and pass in the desired canvas dimensions
const renderGame = (width, height) => {
  ReactDOM.render(
    <GameWindow width={width} height={height} />,
    document.querySelector("#main")
  );
  
  canvas = document.querySelector('#viewport');
  ctx = canvas.getContext('2d');
};

const renderGameInfo = (gameInfo) => {
  ReactDOM.render(
    <GameInfo info={gameInfo} />,
    document.querySelector("#gameInfo")
  );
};

const GameInfo = (props) => {
  
  const disabled = props.info.player.points === 0;
  
  return (
    <div>
      <h1>Game Info</h1>
      <hr />
      <h2>Player Stats</h2>
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
            <button id="increaseHealth" class="levelUpButton" disabled={disabled} onClick={upgradeChar}>+10 HP</button>
          </p>
          <p>
            <span>Strength: {props.info.player.strength} </span>
            <button id="increaseStrength" class="levelUpButton" disabled={disabled} onClick={upgradeChar}>+1 Strength</button>
          </p>
          <p>
            <span>Defense: {props.info.player.defense} </span>
            <button id="increaseDefense" class="levelUpButton" disabled={disabled} onClick={upgradeChar}>+2 Defense</button>
          </p>
          <p>
            <span>Level: {props.info.player.level} (Exp: {props.info.player.exp} / {props.info.player.nextLevel}) </span>
            <meter 
              value={props.info.player.exp} 
              min={props.info.player.prevLevel}
              max={props.info.player.nextLevel}
            >
            </meter>
          </p>
        </div>
      }
      
      {!props.info.player.alive &&
        <button id="respawnButton" onClick={respawnRequest}>Respawn</button>
      }
      
      <hr />
      <h2>Boss Bounty</h2>
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

const CharSelect = (props) => {
  
  //Map the characters object into an array
  const charactersArray = Object.keys(props.characters).map((character) => {
    return props.characters[character];
  });
  
  //Return jsx to inform that player that the characters are still loading
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
      <div class="charPreview">
        <h2>{character.name}</h2>
        <div class="crop-image">
          <img src={character.imageFile} alt={`${character.name} sprite`} />
        </div>
        <hr />
        <div>
          <h3>Stats</h3>
          <p>Strength: {character.strength}</p>
          <p>Defense: {character.defense}</p>
          <p>Health: {character.maxHealth}</p>
        </div>
        <hr />
        <button onClick={chooseCharacter} selectid={character.name}>Select</button>
      </div>
    );
  });
  
  //Return all of the panels (the passed in array auto formats)
  return (
    <div>
      <h1>Select Your Character</h1>
      {charList}
    </div>
  );
};

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

const renderLobby = () => {
    ReactDOM.render(
        <div id="roomContainer">
            <form id="createRoomForm">
                <label for="createRoom">Create a Room</label>
                <input id="createRoomField" type="text" name="createRoom" maxlength="4" size="4"></input>
                    <input type="submit" value="Create Room"></input>
            </form>
                <form id="joinRoomForm">
                <label for="joinRoom">Join a Room</label>
                <input id="joinRoomField" type="text" name="joinRoom" maxlength="4" size ="4"></input>
                <input type="submit" value="Join Room"></input>
            </form>
        </div>,
        document.querySelector("#main")
    ); 
                        
  const createRoomForm = document.querySelector('#createRoomForm');
  const sendCreateReq = e => joinRoom(e, createRoomForm.querySelector('#createRoomField').value, true);
  createRoomForm.addEventListener('submit', sendCreateReq);

  const joinRoomForm = document.querySelector('#joinRoomForm');
  const sendJoinReq = e => joinRoom(e, joinRoomForm.querySelector('#joinRoomField').value, false);
  joinRoomForm.addEventListener('submit', sendJoinReq);    
};
