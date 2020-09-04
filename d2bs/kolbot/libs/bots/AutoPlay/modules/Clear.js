(function (module, require) {

	const GameData = require('../../../modules/GameData');


	const defaults = {
		range: 14,
		spectype: 0,
		once: false,
		nodes: [],
	};
	const shamans = [sdk.monsters.FallenShaman, sdk.monsters.CarverShaman2, sdk.monsters.DevilkinShaman2, sdk.monsters.DarkShaman1, sdk.monsters.WarpedShaman, sdk.monsters.CarverShaman, sdk.monsters.DevilkinShaman, sdk.monsters.DarkShaman2],
		fallens = [sdk.monsters.Fallen, sdk.monsters.Carver2, sdk.monsters.Devilkin2, sdk.monsters.DarkOne1, sdk.monsters.WarpedFallen, sdk.monsters.Carver1, sdk.monsters.Devilkin, sdk.monsters.DarkOne2];

	const clearDistance = (x, y, xx, yy) => {

		getUnits(1).forEach((monster) => {
			if (typeof monster['beendead'] === 'undefined') monster.beendead = false;
			monster.beendead |= monster.dead
		});

		let path = getPath(me.area, x, y, xx, yy, 0, 4);
		if (!path || !path.length) return Infinity;

		return path.reduce((acc, v, i, arr) => {
			let prev = i ? arr[i - 1] : v;
			return acc + Math.sqrt((prev.x - v.x) * (prev.x - v.x) + (prev.y - v.y) * (prev.y - v.y));
		}, 0);
	};

	module.exports = (function (_settings = {}) {
		const settings = Object.assign({}, defaults, _settings);
		const pathCopy = settings.nodes.slice();
		let nearestNode = pathCopy.sort((a, b) => a.distance - b.distance).first();

		const backTrack = () => {

			const index = settings.nodes.indexOf(nearestNode);
			if (index > 0) {

				//ToDo; backtrack further if that is a safer bet

				const nodesBack = Math.min(index, 1);
				console.debug('backtracking ' + nodesBack + ' nodes');
				nearestNode = settings.nodes[index - nodesBack];
				nearestNode.moveTo();
			}
		};

		let start = [], startArea = me.area;
		const getUnits_filtered = () => getUnits(1, -1)
			.filter(unit =>
				global['__________ignoreMonster'].indexOf(unit.gid) === -1 // Dont attack those we ignore
				&& unit.hp > 0 // Dont attack those that have no health 	(catapults and such)
				&& unit.attackable // Dont attack those we cant attack
				&& unit.area === me.area

				// Shamaans have a higher range
				&& (range =>
						start.length // If start has a length
						? getDistance(start[0], start[1], unit) < range // If it has a range smaller as from the start point (when using me.clear)
						: getDistance(this, unit) < range // if "me" move, the object doesnt move. So, check distance of object
				)(shamans.includes(unit.classid) ? settings.range*1.25 : settings.range)
				&& !checkCollision(me, unit, 0x4)
			)
			.filter(unit => {
				if (!settings.spectype || typeof settings.spectype !== 'number') return true; // No spectype =  all monsters
				return unit.spectype & settings.spectype;
			})
			.filter(unit => {
				const skill = GameData.monsterEffort(unit, unit.area);
				return skill.effort <= 6;
			})
			.sort((a, b) => {
				// shamans are a mess early game
				let isShamanA = shamans.indexOf(a.classid) > -1;
				let isFallenB = fallens.indexOf(b.classid) > -1;
				if (isShamanA && isFallenB && !checkCollision(me, unit, 0x7)/*line of sight*/) {
					// return shaman first, if we have a direct line of sight
					console.debug('Direct line =O');
					return -1;
				}
				if (typeof a['beendead'] !== 'undefined' && typeof b['beendead'] === 'undefined' && a['beendead'] && !b['beendead']) {
					return 1; // those that been dead before (aka fallens) will be moved up from the list, so we are more likely to pwn shamans on a safe moment
				}
				return clearDistance(me.x, me.y, a.x, a.y) - (clearDistance(me.x, me.y, b.x, b.y));
			});

		// If we clear around _me_ we move around, but just clear around where we started
		let units;
		if (me === this) start = [me.x, me.y];

		while ((units = getUnits_filtered()).length) {
			if (getUnits(1).filter(unit => unit.attackable && unit.distance < 5).length >= 3) {
				backTrack();
				continue; // we maybe wanna attack someone else now
			}
			const unit = units.shift();

			// Do something with the effort to not kill monsters that are too harsh
			unit.attack();

			if (settings.once || startArea !== me.area) return true;
		}
		return true;
	}).bind(me);

	module.exports.defaults = defaults;

})(module, require);