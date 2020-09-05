(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const Pather = require('../../../../modules/Pather');
	const walkTo = require('../WalkTo');

	new CustomDungeon(sdk.areas.DenOfEvil, function () {
		if (me.getQuest(1, 0)) return;
		let lines;

		const corpseFire = (poi => ({
			x: poi.roomx * 5 + poi.x,
			y: poi.roomy * 5 + poi.y,
		}))(getPresetUnit(sdk.areas.DenOfEvil, 1, 774));

		const rooms = (function (room, ret = []) {
			do {
				let obj = {
					x: room.x * 5 + room.xsize / 2,
					y: room.y * 5 + room.ysize / 2,
					d: 0,
					c: 0,
					s: 0,
				};
				let result = Pather.getNearestWalkable(obj.x, obj.y, 18, 3);
				if (result) {
					let [x, y] = result;
					obj.x = x;
					obj.y = y;
					obj.d = getPath(me.area, x, y, me.x, me.y, 0, 25).map(el => el.distance).reduce((acc, cur) => acc + cur, 0);
					console.debug(corpseFire.x + ',' + corpseFire.y);
					obj.c = getPath(me.area, x, y, corpseFire.x, corpseFire.y, 0, 25).map(el => el.distance).reduce((acc, cur) => acc + cur, 0);

					obj.s = (obj.d * 2) - obj.c;
					console.debug(x, y, Math.round(obj.d), Math.round(obj.c), ' -', Math.round(obj.s));

					ret.push(obj);
				}
			} while (room.getNext());
			return ret;
		})(getRoom());

		// console.debug(rooms);

		// let fastestPath = FastestPath(rooms, 2500);
		// let nodes = fastestPath.winningPath;
		let nodes = rooms;

		nodes.sort((a, b) => (a.s - b.s));
		lines = nodes.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x84, true));


		const clear = require('../clear');
		let _cacheRange = clear.defaults.range;
		clear.defaults.range = 20;

		rooms.some(node => {
			walkTo(node);
			return me.getQuest(1, 0);
		});

		clear.defaults.range = _cacheRange;
	});


})(module, require);