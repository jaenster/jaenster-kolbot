(function (module, require) {

	const Pather = require('../../../modules/Pather');
	const Pickit = require('../../../modules/Pickit');
	const clear = require('./Clear');

	const searchShrine = () => getUnits(2, "shrine")
		.filter(el => el.objtype === 15 && !el.mode)
		.sort((a, b) => (a.objtype - b.objtype) || a.distance - b.distance)
		.first();

	const walkTo = module.exports = function (target, recursion = 0) {
		console.debug('generating path towards target: ', target);
		global['debuglineLol'] = new Line(target.x, target.x, me.x, me.y, 0x12, true);

		/** @type {{x,y}[]|undefined}*/
		const path = Pather.useTeleport() ? getPath(me.area, target.x, target.y, me.x, me.y, 1, 40) : getPath(me.area, target.x, target.y, me.x, me.y, 1, 4);
		if (!path) throw new Error('failed to generate path');

		path.reverse();

		const lines = path.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x33, true));

		const pathCopy = path.slice();
		let loops = 0, shrine;
		for (let i = 0, node, l = path.length; i < l; loops++) {

			node = path[i];
			// console.debug('Moving to node (' + i + '/' + l + ') -- ' + Math.round(node.distance * 100) / 100);

			node.moveTo();

			// ToDo; only if clearing makes sense in this area due to effort
			clear({nodes: path});
			Pickit.pickItems();

			// if shrine found, click on it
			if ((shrine = searchShrine())){
				shrine.moveTo();
				shrine.click();
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