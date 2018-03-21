const lerp = (pos1, pos2, ratio) => {
	const component1 = (1 - ratio) * pos1;
	const component2 = ratio * pos2;
	return component1 + component2;
};

const draw = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//Draw code
	const playerKeys = Object.keys(players);
	frameCounter++;
	
	for(let i = 0; i < playerKeys.length; i++){
		const player = players[playerKeys[i]];
		
		if(player.ratio < 1){
			player.ratio += 0.05;
		}
		
		ctx.save();
		
		player.x = lerp(player.prevX, player.destX, player.ratio);
		player.y = lerp(player.prevY, player.destY, player.ratio);
		
		if(frameCounter % player.anim.speed === 0){
			player.frame = (player.frame + 1) % player.anim.frameCount;
		}
		
		if(defaultChar){
			ctx.drawImage(
				defaultChar,
				player.width * player.frame,
				player.height * (player.anim.row + player.direction),
				player.width,
				player.height,
				player.x,
				player.y,
				player.width,
				player.height
			);
		}
		
		ctx.restore();
	}
};