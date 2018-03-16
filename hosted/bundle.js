"use strict";

var lerp = function lerp(pos1, pos2, ratio) {
	var component1 = (1 - ratio) * pos1;
	var component2 = ratio * pos2;
	return component1 + component2;
};

var draw = function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//Draw code
};
"use strict";

var canvas = void 0,
    ctx = void 0;
var socket = void 0;
var animationFrame = void 0;

var init = function init() {
	canvas = document.querySelector("#viewport");
	ctx = canvas.getContext('2d');

	//Move to a socket joined / initialized event later
	animationFrame = requestAnimationFrame(update);

	socket = io.connect();
};

window.onload = init;
"use strict";

var update = function update() {
	//Update code
	draw();

	animationFrame = requestAnimationFrame(update);
};
