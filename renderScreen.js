export default function renderScreen(screen, game, requestAnimationFrame) {
	const context = screen.getContext("2d");
	context.clearRect(0, 0, 25, 25);

	for (const fruitId in game.state.fruits) {
		const fruit = game.state.fruits[fruitId];
		context.fillStyle = "green";
		context.fillRect(fruit.x, fruit.y, 1, 1);
	}

	for (const wallId in game.state.walls) {
		const wall = game.state.walls[wallId];
		context.fillStyle = "#222";
		context.fillRect(wall.x, wall.y, 1, 1);
	}

	for (const playerId in game.state.players) {
		const player = game.state.players[playerId];
		context.fillStyle = playerId === "player" ? "yellow" : "red";
		context.fillRect(player.x, player.y, 1, 1);
	}

	requestAnimationFrame(() => {
		renderScreen(screen, game, requestAnimationFrame);
	});
}
