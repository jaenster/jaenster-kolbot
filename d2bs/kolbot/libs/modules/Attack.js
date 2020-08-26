/**
 * @description An attack script determins what skill to use, whenever it can
 * @Author Jaenster
 */

(function (module, require) {
	const CollMap = require('../modules/CollMap');
	const Pather = require('../modules/Pather');
	const Attack = function () {

	};

	Attack.clear = function (range, spectype, walk = false) {
		return me.clear.apply(me, [range, spectype, walk]);
	};

	Attack.checkMonster = function (monster) {
		return monster.attackable;
	};
	Attack.deploy = function (unit, distance, spread, range) {
		if (arguments.length < 4) {
			throw new Error("deploy: Not enough arguments supplied");
		}
		const buildGrid = function (xmin, xmax, ymin, ymax, spread) {
			if (xmin >= xmax || ymin >= ymax || spread < 1) {
				throw new Error("buildGrid: Bad parameters");
			}

			var i, j, coll,
				grid = [];

			for (i = xmin; i <= xmax; i += spread) {
				for (j = ymin; j <= ymax; j += spread) {
					coll = CollMap.getColl(i, j, true);

					if (typeof coll === "number") {
						grid.push({x: i, y: j, coll: coll});
					}
				}
			}

			return grid;
		};

		var i, grid, index, currCount,
			tick = getTickCount(),
			monList = [],
			count = 999,
			idealPos = {
				x: Math.round(Math.cos(Math.atan2(me.y - unit.y, me.x - unit.x)) * Config.DodgeRange + unit.x),
				y: Math.round(Math.sin(Math.atan2(me.y - unit.y, me.x - unit.x)) * Config.DodgeRange + unit.y)
			};

		monList = getUnits(1).filter(x => !x.allies).sort((a, b) => a.distance - b.distance);


		if (monList.filter(x => x.distance < 15).length === 0) {
			return true;
		}

		CollMap.getNearbyRooms(unit.x, unit.y);

		grid = buildGrid(unit.x - distance, unit.x + distance, unit.y - distance, unit.y + distance, spread);

		//print("Grid build time: " + (getTickCount() - tick));

		if (!grid.length) {
			return false;
		}

		function sortGrid(a, b) {
			//return getDistance(a.x, a.y, idealPos.x, idealPos.y) - getDistance(b.x, b.y, idealPos.x, idealPos.y);
			return getDistance(b.x, b.y, unit.x, unit.y) - getDistance(a.x, a.y, unit.x, unit.y);
		}

		grid.sort(sortGrid);

		for (i = 0; i < grid.length; i += 1) {
			if (!(CollMap.getColl(grid[i].x, grid[i].y, true) & 0x1) && !CollMap.checkColl(unit, {
				x: grid[i].x,
				y: grid[i].y
			}, 0x4)) {
				currCount = monList.filter(x => x.distance < 15).length;

				if (currCount < count) {
					index = i;
					count = currCount;
				}

				if (currCount === 0) {
					break;
				}
			}
		}

		//print("Safest spot with " + count + " monsters.");

		if (typeof index === "number") {
			//print("Dodge build time: " + (getTickCount() - tick));

			return Pather.moveTo(grid[index].x, grid[index].y, 0);
		}

		return false;
	};

	Attack.clearLevel = function (obj) {
		let room = getRoom(), rooms = [], result, myRoom, currentArea = getArea().id,
			previousArea,
			spectype,
			quitWhen = () => {
			};

		const Config = require('../modules/Config');

		if (!room) return false;

		if (typeof obj === 'object' && obj /*not null*/) {
			spectype = obj.hasOwnProperty('spectype') && obj.spectype || 0;
			quitWhen = obj.hasOwnProperty('quitWhen') && typeof obj.quitWhen === 'function' && obj.quitWhen || quitWhen;
		}
		if (typeof obj !== 'object') {
			spectype = Config.ClearType;
		}


		for (; room.getNext();) rooms.push([room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2]);

		while (rooms.length > 0) {
			// get the first room + initialize myRoom var
			!myRoom && (room = getRoom(me.x, me.y));

			if (room) {
				if (room instanceof Array) { // use previous room to calculate distance
					myRoom = [room[0], room[1]];
				} else { // create a new room to calculate distance (first room, done only once)
					myRoom = [room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2];
				}
			}

			rooms.sort((a, b) => getDistance(myRoom[0], myRoom[1], a[0], a[1]) - getDistance(myRoom[0], myRoom[1], b[0], b[1]));
			room = rooms.shift();

			result = Pather.getNearestWalkable(room[0], room[1], 18, 3);

			if (result) {
				Pather.moveTo(result[0], result[1], 3, spectype);
				previousArea = result;
				if (typeof quitWhen === 'function' && quitWhen()) return true;
				if (!me.clear(40, spectype)) break;

			} else if (currentArea !== getArea().id) { // Make sure bot does not get stuck in different area.
				Pather.moveTo(previousArea[0], previousArea[1], 3, spectype);
			}
		}
		return true;
	};

	Attack.clearLevelWalk = function (spectype) {
		const Graph = require('Graph');

		let graph = new Graph();
		Graph.depthFirstSearch(graph, room => {
			Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			Attack.clear(room.xsize, spectype || 0);
		});
	};

	Attack.kill = function (classId) {
		if (!classId) throw TypeError('Should call Attack.Kill upon something');
		const unit = classId instanceof Unit && classId || getUnit(1, classId);
		if (!unit) throw new Error("Attack.kill: Target not found");

		return unit.kill();
	};

	Attack.securePosition = function (x, y, range, timer, skipBlocked, special) {
		let monster, monList, tick;

		if (skipBlocked === true) {
			skipBlocked = 0x4;
		}

		while (true) {
			if ([x, y].distance > 5) {
				Pather.moveTo(x, y);
			}

			monster = getUnit(1);
			monList = [];

			if (monster) {
				do {
					if (getDistance(monster, x, y) <= range && monster.attackable && !monster.dead &&
						(!skipBlocked || !checkCollision(me, monster, skipBlocked)) &&
						((me.classid === 1 && me.getSkill(54, 1)) || me.getStat(97, 54) || !checkCollision(me, monster, 0x1))) {
						monList.push(copyUnit(monster));
					}
				} while (monster.getNext());
			}

			if (!monList.length) {
				if (!tick) {
					tick = getTickCount();
				}

				// only return if it's been safe long enough
				if (getTickCount() - tick >= timer) {
					return true;
				}
			} else {
				monList.forEach(monster => monster.kill());

				// reset the timer when there's monsters in range
				if (tick) {
					tick = false;
				}
			}

			delay(100);
		}

		return true;
	}

	module.exports = Attack;
})(module, require);
