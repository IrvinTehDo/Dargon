let canvas, ctx;
let socket, hash;
let animationFrame;
let players = {};

let frameCounter = 0;

let defaultChar;

const keyDownEvent = (e) => {
	const key = e.which;
	const player = players[hash];
	
	if(key === 87 || key === 38) {
		player.moveUp = true;
	} else if(key === 83 || key === 40){
		player.moveDown = true;
	} else if(key === 65 || key === 37){
		player.moveLeft = true;
	} else if(key === 68 || key === 39){
		player.moveRight = true;
	} else if(key === 32){
		sendAttack();
	}
};

const keyUpEvent = (e) => {
	const key = e.which;
	const player = players[hash];
	
	if(key === 87 || key === 38) {
		player.moveUp = false;
	} else if(key === 83 || key === 40){
		player.moveDown = false;
	} else if(key === 65 || key === 37){
		player.moveLeft = false;
	} else if(key === 68 || key === 39){
		player.moveRight = false;
	}
};

const init = () => {
	canvas = document.querySelector("#viewport");
	ctx = canvas.getContext('2d');
	
	defaultChar = document.querySelector("#defaultChar");
	
	socket = io.connect();
	socket.on('setPlayer', setPlayer);
	socket.on('receiveAttack', receiveAttack);
	socket.on('updatePlayer', updatePlayer);
	socket.on('deletePlayer', deletePlayer);
	
	document.body.addEventListener('keydown', keyDownEvent);
	document.body.addEventListener('keyup', keyUpEvent);
};

window.onload = init;