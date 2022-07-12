export default function createEnemies(game) {
	const state = {
		observers: [],
		enemiesData: {},
		limitX: game.state.screen.width,
		limitY: game.state.screen.height,
	};

	function subscribe(observerFunction) {
		state.observers.push(observerFunction);
	}

	function notifyAll(command) {
		for (const observerFunction of state.observers) {
			observerFunction(command);
		}
	}

	function start() {
		for (const enemyId in game.state.players) {
			if (enemyId === "player") continue;
			const goal = undefined;
			const path = [];
			const dist = Infinity;
			const canWalk = false;

			state.enemiesData[enemyId] = {
				goal,
				path,
				dist,
				canWalk,
			};
		}
	}

	async function walk() {
		await new Promise((r) => setTimeout(r, 100));

		for (const enemyId in game.state.players) {
			if (enemyId === "player") continue;
			let togo = state.enemiesData[enemyId].path.shift();

			if (!togo || !state.enemiesData[enemyId].canWalk) continue;
			const command = {
				playerId: enemyId,
				keyPressed: togo,
			};
			notifyAll(command);
		}

		walk();
	}

	function search(command) {
		if (command.type === "addFruit") {
			for (const enemyId in game.state.players) {
				if (enemyId === "player") continue;

				let enemy = game.state.players[enemyId];
				let dX = Math.abs(enemy.x - command.x);
				let dY = Math.abs(enemy.y - command.y);
				let delta = dX + dY;

				if (delta < state.enemiesData[enemyId].dist) {
					const param = {
						enemyId,
						fx: command.x,
						fy: command.y,
						delta,
						canWalk: false,
					};

					enemiesCtrl(param);
				}
			}
		} else if (command.type === "removeFruit") {
			for (const enemyId in state.enemiesData) {
				const enemy = state.enemiesData[enemyId];
				if (enemy.goal.x === command.x && enemy.goal.y === command.y) {
					state.enemiesData[enemyId].goal = undefined;
					state.enemiesData[enemyId].canWalk = false;
					state.enemiesData[enemyId].dist = Infinity;
					state.enemiesData[enemyId].path = [];
				}
			}
		}
	}

	function enemiesCtrl(command) {
		const enemies = {
			bfs(command) {
				bfsEnemy(command);
			},
			heu(command) {
				heuEnemy(command);
			},
		};

		const enemyId = command.enemyId;
		const enemy = game.state.players[enemyId];
		const enemyAction = enemies[enemyId];

		if (enemy && enemyAction) {
			command.enemy = enemy;
			enemyAction(command);
		}
	}

	function bfsEnemy(command) {
		let start = { x: command.enemy.x, y: command.enemy.y };
		let goal = { x: command.fx, y: command.fy };

		let frontier = [start];
		let cameFrom = {};
		let visited = new Set();

		let pos = undefined;
		let neighbours = undefined;

		while (frontier.length > 0) {
			pos = frontier.shift();
			if (pos === goal) break;

			neighbours = genNeighbours(pos.x, pos.y);
			neighbours = neighbours.filter((n) => !visited.has(n));

			neighbours.forEach((c) => {
				visited.add(c);
				if (cameFrom[c.x + " " + c.y] === undefined) {
					frontier.push(c);
					cameFrom[c.x + " " + c.y] = pos;
				}
			});
		}
		let path = genPath(cameFrom, start, goal);
		state.enemiesData[command.enemyId].goal = goal;
		state.enemiesData[command.enemyId].path = path;
		state.enemiesData[command.enemyId].dist = command.delta;
		state.enemiesData[command.enemyId].canWalk = true;
	}

	function heuEnemy(command) {
		let start = { x: command.enemy.x, y: command.enemy.y };
		let goal = { x: command.fx, y: command.fy };

		let frontier = new PriorityQueue();
		frontier.enqueue([start, 0]);

		let cameFrom = {};
		let current = undefined;
		let neighbours = undefined;

		let visited = new Set();

		while (!frontier.isEmpty()) {
			current = frontier.dequeue();

			if (current === goal) break;

			neighbours = genNeighbours(current.x, current.y);
			neighbours = neighbours.filter((n) => !visited.has(n));

			neighbours.forEach((c) => {
				visited.add(c);
				if (cameFrom[c.x + " " + c.y] === undefined) {
					let dX = Math.abs(current.x - c.x);
					let dY = Math.abs(current.y - c.y);
					let delta = dX + dY;
					frontier.enqueue([c, delta]);
					cameFrom[c.x + " " + c.y] = current;
				}
			});
		}

		let path = genPath(cameFrom, start, goal);
		state.enemiesData[command.enemyId].goal = goal;
		state.enemiesData[command.enemyId].path = path;
		state.enemiesData[command.enemyId].dist = command.delta;
		state.enemiesData[command.enemyId].canWalk = true;
	}

	function genPath(cameFrom, start, goal) {
		let path = [];
		let pos = goal;
		let next = cameFrom[pos.x + " " + pos.y];

		if (next === undefined) return [];

		while (pos !== start) {
			if (pos.y > next.y) {
				path.push("ArrowDown");
			} else if (pos.y < next.y) {
				path.push("ArrowUp");
			} else if (pos.x < next.x) {
				path.push("ArrowLeft");
			} else if (pos.x > next.x) {
				path.push("ArrowRight");
			}
			pos = next;
			next = cameFrom[next.x + " " + next.y];
		}
		path = path.reverse();

		return path;
	}

	function genNeighbours(row, column) {
		let neighbours = [];

		const top = row !== 0 ? { x: row - 1, y: column } : undefined;
		const right =
			column !== state.limitX - 1 ? { x: row, y: column + 1 } : undefined;
		const bottom =
			row !== state.limitY - 1 ? { x: row + 1, y: column } : undefined;
		const left = column !== 0 ? { x: row, y: column - 1 } : undefined;

		if (top && !game.state.walls[top.x + " " + top.y]) neighbours.push(top);
		if (right && !game.state.walls[right.x + " " + right.y])
			neighbours.push(right);
		if (bottom && !game.state.walls[bottom.x + " " + bottom.y])
			neighbours.push(bottom);
		if (left && !game.state.walls[left.x + " " + left.y])
			neighbours.push(left);

		return neighbours;
	}

	// fonte: https://linuxhint.com/priority-queue-javascript/
	class PriorityQueue {
		constructor() {
			var array = [];
			this.printCollection = function () {
				console.log(array);
			};
			this.enqueue = function (newMem) {
				if (this.isEmpty()) {
					array.push(newMem);
				} else {
					var added = false;
					for (var i = 0; i < array.length; i++) {
						if (newMem[1] < array[i][1]) {
							array.splice(i, 0, newMem);
							added = true;
							break;
						}
					}
					if (!added) {
						array.push(newMem);
					}
				}
			};
			this.dequeue = function () {
				var value = array.shift();
				return value[0];
			};
			this.front = function () {
				return array[0];
			};
			this.size = function () {
				return array.length;
			};
			this.isEmpty = function () {
				return array.length === 0;
			};
		}
	}

	return {
		subscribe,
		search,
		start,
		walk,
	};
}
