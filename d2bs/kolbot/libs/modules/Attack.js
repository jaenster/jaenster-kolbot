/**
 * @description An attack script determins what skill to use, whenever it can
 * @Author Jaenster
 */

(function (module, require) {

	const Attack = function () {

	};

	Attack.clear = function (range) {
		return me.clear.apply(me, [range]);
	};

	Attack.checkMonster = function (monster) {
		return monster.attackable;
	};
	Attack.deploy = function(...args) {
		// ToDO; create, atleast this doesnt break the entire scripts
		return true; // always succeeded
	}

	Attack.clearLevel = function (obj) {
		let room = getRoom(), rooms = [], result, myRoom, currentArea = getArea().id,
			previousArea,
			spectype,
			quitWhen = () => {
			};

		const Config = require('Config');

		if (!room) return false;

		if (typeof obj === 'object' && obj /*not null*/) {
			spectype = obj.hasOwnProperty('spectype') && obj.spectype || 0;
			quitWhen = obj.hasOwnProperty('quitWhen') && typeof obj.quitWhen === 'function' && obj.quitWhen || quitWhen;
		}
		if (obj !== 'object') {
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
