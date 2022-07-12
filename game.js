export default function createGame() {
	const state = {
		players: {},
		fruits: {},
		walls: {},
		addingWall: false,
		screen: {
			width: 25,
			height: 25,
		},
	};

	const observers = [];

	function subscribe(observerFunction) {
		observers.push(observerFunction);
	}

	function notifyAll(command) {
		for (const observerFunction of observers) {
			observerFunction(command);
		}
	}

	function start() {
		addPlayer({ playerId: "player" });
		addPlayer({ playerId: "bfs" });
		addPlayer({ playerId: "heu" });
		genFruit();
	}

	function addPlayer(command) {
		command = command ? command : {};

		const playerId =
			"playerId" in command ? command.playerId : Date.now().toString(); // unique ID
		const playerX =
			"playerX" in command
				? command.playerX
				: Math.floor(Math.random() * state.screen.width);
		const playerY =
			"playerY" in command
				? command.playerY
				: Math.floor(Math.random() * state.screen.height);

		state.players[playerId] = {
			x: playerX,
			y: playerY,
		};
	}

	function removePlayer(command) {
		const playerId = command.playerId;
		delete state.players[playerId];
	}

	function genFruit() {
		const freq = ((state.screen.width + state.screen.height) / 2) * 100;
		setInterval(addFruit, freq);
	}

	function addFruit(command) {
		command = command ? command : {};

		const fruitId =
			"fruitId" in command ? command.fruitId : Date.now().toString(); // unique ID
		const fruitX =
			"fruitX" in command
				? command.fruitX
				: Math.floor(Math.random() * state.screen.width);
		const fruitY =
			"fruitY" in command
				? command.fruitY
				: Math.floor(Math.random() * state.screen.height);

		state.fruits[fruitId] = {
			x: fruitX,
			y: fruitY,
		};

		notifyAll({
			type: "addFruit",
			x: fruitX,
			y: fruitY,
		});
	}

	function removeFruit(command) {
		const fruitId = command.fruitId;
		const fruitX = state.fruits[fruitId].x;
		const fruitY = state.fruits[fruitId].y;

		delete state.fruits[fruitId];

		notifyAll({
			type: "removeFruit",
			x: fruitX,
			y: fruitY,
		});
	}

	function addWall(command) {
		const wallId = command.wallId;
		const wallX = command.x;
		const wallY = command.y;

		state.wallsLen++;
		state.walls[wallId] = {
			x: wallX,
			y: wallY,
		};
	}

	function removeWall(command) {
		const wallId = command.wallId;
		delete state.walls[wallId];
		state.wallsLen--;
	}

	function wallSetup(player, playerId) {
		if (playerId !== "player") return;

		const wallId = player.x + " " + player.y;

		if (state.walls[wallId]) {
			removeWall({ wallId });
		} else {
			addWall({ wallId: wallId, x: player.x, y: player.y });
		}
	}

	function playerCtrl(command) {
		const acceptedMoves = {
			ArrowUp(player) {
				if (player.y - 1 >= 0) {
					player.y--;
					return;
				}
			},
			ArrowRight(player) {
				if (player.x + 1 < state.screen.width) {
					player.x++;
					return;
				}
			},
			ArrowDown(player) {
				if (player.y + 1 < state.screen.height) {
					player.y++;
					return;
				}
			},
			ArrowLeft(player) {
				if (player.x - 1 >= 0) {
					player.x--;
					return;
				}
			},
			w() {
				state.addingWall = !state.addingWall;
			},
		};

		const keyPressed = command.keyPressed;
		const playerId = command.playerId;
		const player = state.players[playerId];
		const moveFunction = acceptedMoves[keyPressed];

		if (player && moveFunction) {
			moveFunction(player);
			checkForFruitCollision(playerId);

			if (state.addingWall) {
				wallSetup(player, playerId);
			}
		}
	}

	function checkForFruitCollision(playerId) {
		const player = state.players[playerId];

		for (const fruitId in state.fruits) {
			const fruit = state.fruits[fruitId];
			if (player.x === fruit.x && player.y === fruit.y) {
				removeFruit({ fruitId: fruitId });
			}
		}
	}

	return {
		subscribe,
		start,
		addPlayer,
		removePlayer,
		addFruit,
		removeFruit,
		playerCtrl,
		state,
	};
}
