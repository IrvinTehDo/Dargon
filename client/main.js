let canvas, ctx;
let socket;
let animationFrame;

const init = () => {
	canvas = document.querySelector("#viewport");
	ctx = canvas.getContext('2d');
	
	//Move to a socket joined / initialized event later
	animationFrame = requestAnimationFrame(update);
	
	socket = io.connect();
};

window.onload = init;