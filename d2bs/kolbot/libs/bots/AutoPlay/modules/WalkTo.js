(function (module, require) {

	const Pather = require('../../../modules/Pather');
	const Pickit = require('../../../modules/Pickit');
	const Misc = require('../../../modules/Misc');
	const clear = require('./Clear');

	const GameAnalyzer = require('./GameAnalyzer');

	const searchShrine = () => getUnits(2, "shrine")
		.filter(el => el.objtype === 15 && !el.mode)
		.sort((a, b) => (a.objtype - b.objtype) || a.distance - b.distance)
		.first();

	module.exports = function walkTo(target, recursion = 0) {
		console.debug('generating path towards target: ', target);
		global['debuglineLol'] = new Line(target.x, target.y, me.x, me.y, 0x84, true);

		const allAreas = GameAnalyzer.area;

		// tells us if we can use teleport, not if we have enough mana for it, but if its theoretically possible to teleport here
		const canTeleport = Pather.canTeleport();

		// Do not calculate teleport path, if we want subnodes
		/** @type {{x,y}[]|undefined}*/
		const path = canTeleport && !recursion ? getPath(me.area, target.x, target.y, me.x, me.y, 1, 40) : getPath(me.area, target.x, target.y, me.x, me.y, 1, 4);
		if (!path) throw new Error('failed to generate path');

		path.reverse();

		const lines = path.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x33, true));

		//ToDO; implement teleportation on higher distances,
		// aka calculate the node size, and make subnodes if teleportion, or jump a gap if that is quicker.
		// anyway, for now, it just walks

		const pathCopy = path.slice();
		let loops = 0, shrine;
		for (let i = 0, node, l = path.length; i < l; loops++) {

			node = path[i];
			// console.debug('Moving to node (' + i + '/' + l + ') -- ' + Math.round(node.distance * 100) / 100);

			// The path generated is long, we want sub nodes
			if (node.distance > 30) {
				const d = Pather.getWalkDistance(node.x, node.y);

				// If walking to the node is twice as far as teleporting, we teleport
				if (canTeleport && d * 2 > node.distance) {
					Pather.teleportTo(node.x, node.y);
				} else if (!recursion) {
					walkTo(node, recursion++);
				}
			}

			// decent fix for this
			me.cancel() && me.cancel() && me.cancel() && me.cancel();
			Pather.walkTo(node.x, node.y, 2);

			// ToDo; only if clearing makes sense in this area due to effort
			clear({nodes: path});
			Pickit.pickItems();

			// if shrine found, click on it
			if (!recursion && (shrine = searchShrine())) {
				// ToDo; use walk near / tk if we got it
				walkTo(shrine, recursion++);

				// As long the shrine is active click the thing
				Misc.poll(() => shrine.mode === 0 && shrine.click());
			}

			// if this wasnt our last node
			if (l - 1 !== i) {

				// Sometimes we go way out track due to clearing,
				// lets find the nearest node on the path and go from there
				let nearestNode = pathCopy.sort((a, b) => a.distance - b.distance).first();

				// if the nearnest node is still in 95% of our current node, we dont need to reset
				if (nearestNode.distance > 5 && node.distance > 5 && 100 / node.distance * nearestNode.distance < 95) {

					console.debug('reseting path to other node');
					// reset i to the nearest node
					i = path.findIndex(node => nearestNode.x === node.x && nearestNode.y === node.y);
					continue; // and there for no i++
				}
			}

			i++;
		}
		console.debug('Took ' + loops + ' to continue ' + path.length + ' steps');
	}

})(module, require);