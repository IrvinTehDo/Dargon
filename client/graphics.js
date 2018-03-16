const lerp = (pos1, pos2, ratio) => {
	const component1 = (1 - ratio) * pos1;
	const component2 = ratio * pos2;
	return component1 + component2;
};

const draw = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	//Draw code
};