(function (module, require) {

	const Pather = require('../../../modules/Pather');
	const Pickit = require('../../../modules/Pickit');
	const Misc = require('../../../modules/Misc');
	const clear = require('./Clear');


	const Worker = require('../../../modules/Worker');

	const Delta = new (require('../../../modules/Deltas'));
	new function () {
		const lines = [];
		const update = function () {
			const room = getRoom();
			let removeElements = lines.length;

			if (room && !me.inTown) do {

				let x1 = room.x * 5, x2 = room.x * 5 + room.xsize,
					y1 = room.y * 5, y2 = room.y * 5 + room.ysize;

				lines.push(new Line(x1, y1, x2, y1, 0x22/*0x84*/, true));
				lines.push(new Line(x2, y1, x2, y2, 0x22/*0x84*/, true));
				lines.push(new Line(x2, y2, x1, y2, 0x22/*0x84*/, true));
				lines.push(new Line(x1, y2, x1, y1, 0x22/*0x84*/, true));
			} while (room.getNext());

			// remove old lines
			removeElements && lines.splice(0, removeElements);
		};
		Delta.track(() => me.area, update);
		update();
	};


	const GameAnalyzer = require('./GameAnalyzer');

	const searchShrine = () => getUnits(2, "shrine")
		.filter(el => {

			if (el.objtype === sdk.shrines.Experience && !el.mode) {
				return true;
			}

			if (el.objtype === sdk.shrines.Mana && !el.mode && 100 / me.mpmax * me.mp) {

			}
		})
		.sort((a, b) => (a.objtype - b.objtype) || a.distance - b.distance)
		.first();

	module.exports = function walkTo(target, allowTeleport = true, rangeOverride = null) {
		if (target instanceof PresetUnit) target = target.realCoords();

		const endPoint = Array.isArray(target) ? target.last() : target;

		console.debug('generating path towards target.' + getDistance(me, endPoint));
		global['debuglineLol'] = new Line(endPoint.x, endPoint.y, me.x, me.y, 0x84, true);

		const allAreas = GameAnalyzer.areas;

		let winner = Infinity, best = -Infinity, myScore = -Infinity;
		for (let i = 0; i < allAreas.length; i++) {
			const [area, score] = allAreas[i];

			if (area.Index === me.area) myScore = score;

			if (score > best) {
				best = score;
				winner = area;
			}
		}

		// calculate the % of effectiveness here compared to the best
		let clearPercentage = Math.floor((100 / best * myScore) + 1);

		// If we are very low on gold just clear everywhere for gold
		if (clearPercentage < 70 && me.gold < Config.LowGold / 2) clearPercentage = 100;

		// tells us if we can use teleport, not if we have enough mana for it, but if its theoretically possible to teleport here
		const canTeleport = Pather.canTeleport();

		console.debug('Gonna clear for ' + Math.round(clearPercentage) + '% -- Can teleport: ' + canTeleport);

		// Do not calculate teleport path, if we want subnodes
		if (!Array.isArray(target)) target = [target];

		/** @type {{x,y,index}[]|undefined}*/
		const path = target.map((target, index, self) => {
			// The next node starts with the last node
			let fromx = !index ? me.x : self[index - 1].x,
				fromy = !index ? me.y : self[index - 1].y;

			let path = (getPath(me.area, target.x, target.y, fromx, fromy, 2, 4) || []);
			// sometimes the reduction path messes us that we dont have any path left to take (bugs in arcane)
			if (!path.length) path = (getPath(me.area, target.x, target.y, fromx, fromy, 0, 4) || []);

			return path.map(el => ({x: el.x, y: el.y, index: index}));
		}).reduce((cur, acc) => {
			// push each node to the list
			cur.forEach(el => acc.push(el));
			return acc;
		}, []);
		if (!path) throw new Error('failed to generate path');


		path.reverse();

		const lines = path.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x33, true));

		//ToDO; implement teleportation on higher distances,
		// aka calculate the node size, and make subnodes if teleportion, or jump a gap if that is quicker.
		// anyway, for now, it just walks

		const pathCopy = path.slice();
		let loops = 0, shrine;
		for (let i = 0, node, l = path.length; i < l; loops++) {

			// If we have the ability to teleport, lets see what is the node that is the _most_ far away
			if (allowTeleport && canTeleport && Pather.useTeleport()) {
				let myDistanceFromTarget = getDistance(me, target),
					myRoom = getRoom(me.x, me.y);

				//ToDo; figure out a real way to determin if its a neighbour
				const teleportTo = path.slice(i).filter(el => getDistance(me, el.x, el.y) <= 50 /* dont waste teles on short distances*/)
					//
					.map((el, index) => ({
						g: getDistance(me, el.x, el.y),
						index: index + i,
						isNeighbour: myRoom.isNeighbour(getRoom(el.x, el.y)),
					}))
					// We cannot teleport on a higher distance as 1 room away
					.filter(el => el.isNeighbour)
					// .filter(el => el.g < 40)
					// Only to those nodes that bring us closer to the target
					.filter(el => el.g > 15)
					// The farther the better
					.sort((a, b) => b.g - a.g)
					.first();

				if (teleportTo && teleportTo.index > i) {
					me.cancel();
					node = path[teleportTo.index];
					console.debug('Teleporting to node (' + teleportTo.index + '/' + l + ') -- Skipping ' + (teleportTo.index - i) + ' nodes. Distance of ' + (Math.round(node.distance)));
					[].filter.constructor('return this')()['WHATEVER'] = new Line(node.x, node.y, me.x, me.y, 0x99, true);
					let [x, y] = [me.x, me.y];
					console.debug('Teleporting?');
					me.cast(54, 0, node.x, node.y, undefined, true);

					console.debug('Teleported?');
					// if teleported succesfully
					if (Misc.poll(() => me.x !== x || me.y !== y, 1000, 3)) {
						i = teleportTo.index++;
					}
					console.debug('Teleported!');
					continue;
				}
			}

			node = path[i];
			path.index = i;

			console.debug('Moving to node (' + i + '/' + l + ') -- ' + Math.round(node.distance * 100) / 100);
			if (node.distance < 1.5) {
				i++;
				continue;
			}

			// The path generated is long, we want sub nodes
			if (node.distance > 30) {
				const d = Pather.getWalkDistance(node.x, node.y);

				// If walking to the node is twice as far as teleporting, we teleport
				if (canTeleport && d * 2 > node.distance) {
					Pather.teleportTo(node.x, node.y);
				} else {
					console.debug('DONT USE RECURSION HERE WTF?');
					node.moveTo();
				}
			}

			// decent fix for this
			me.cancel() && me.cancel() && me.cancel() && me.cancel();
			if (node.distance > 2) {
				Pather.walkTo(node.x, node.y);
			}

			// ToDo; only if clearing makes sense in this area due to effort
			let range = 14 / 100 * clearPercentage;
			clear({nodes: path, range: rangeOverride || Math.max(4, range)});
			Pickit.pickItems();

			// if shrine found, click on it
			if ((shrine = searchShrine())) {
				// ToDo; use walk near / tk if we got it
				shrine.moveTo();

				// As long the shrine is active click the thing
				Misc.poll(() => shrine.mode !== 0 || shrine.click());
			}

			// if this wasnt our last node
			if (l - 1 !== i) {

				// Sometimes we go way out track due to clearing,
				// lets find the nearest node on the path and go from there
				// but not of the next node path
				let nearestNode = pathCopy.filter(el => el.index === node.index).sort((a, b) => a.distance - b.distance).first();

				// if the nearnest node is still in 95% of our current node, we dont need to reset
				if (nearestNode.distance > 5 && node.distance > 5 && 100 / node.distance * nearestNode.distance < 95) {

					console.debug('reseting path to other node');
					// reset i to the nearest node
					let newIndex = path.findIndex(node => nearestNode.x === node.x && nearestNode.y === node.y);
					// Move forward
					if (newIndex > i) i = newIndex;
					continue; // and there for no i++
				}
			}

			i++;
		}
		console.debug('Took ' + loops + ' to continue ' + path.length + ' steps');
	}

})(module, require);
