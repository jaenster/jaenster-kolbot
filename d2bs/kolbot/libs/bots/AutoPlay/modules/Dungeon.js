(function (module, require) {

	const AreaData = require('../../../modules/AreaData');

	const Feedback = require('./Feedback');
	const GameAnalyzer = require('./GameAnalyzer');
	const GameData = require("../../../modules/GameData");


	const clear = (function () {
		const defaults = {
			range: 12,
			spectype: 0,
			once: false,
			nodes: [],
		};
		return (function (_settings = {}) {
			const settings = Object.assign({}, defaults, _settings);
			const pathCopy = settings.nodes.slice();
			let nearestNode = pathCopy.sort((a, b) => a.distance - b.distance).first();

			const backTrack = () => {

				const index = settings.nodes.indexOf(nearestNode);
				if (index > 0) {
					const nodesBack = Math.min(index, 1);
					console.debug('backtracking '+nodesBack+' nodes');
					nearestNode = settings.nodes[index-nodesBack];
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
					&& (
						start.length // If start has a length
							? getDistance(start[0], start[1], unit) < settings.range // If it has a range smaller as from the start point (when using me.clear)
							: getDistance(this, unit) < settings.range // if "me" move, the object doesnt move. So, check distance of object
					)
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
				.sort((a, b) => a.distance - b.distance);

			// If we clear around _me_ we move around, but just clear around where we started
			let units;
			if (me === this) start = [me.x, me.y];

			while ((units = getUnits_filtered()).length) {
				if (getUnits(1).filter(unit => unit.attackable && unit.distance < 5).length >= 2) {
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
	})();

	const FastestPath = (nodes, timeLimit = 250) => {
		const hooks = [];

		const calcDistance = (nodes) => {
			let sum = 0;
			for (let i = 0; i < nodes.length - 1; i++) sum += getDistance(nodes[i].x, nodes[i].y, nodes[i + 1].x, nodes[i + 1].y);
			return sum;
		};


		let recordDistance = calcDistance(nodes);
		let winningPath = nodes.slice(); // current

		let x, y, d;
		const singleRun = () => {
			x = rand(1, nodes.length);
			y = rand(1, nodes.length);
			const tmp = nodes[x];
			nodes[x] = nodes[y];
			nodes[y] = tmp;

			hooks.forEach(line => line.remove());
			nodes.forEach((e, i, s) => i && hooks.push(new Line(e[2], e[3], s[i - 1][2], s[i - 1][3], 0x37, true)));

			d = calcDistance(nodes);

			if (d < recordDistance) {
				FastestPath.DebugLines.forEach(line => line.remove());
				nodes.forEach((e, i, s) => s.length - 1 !== i && DebugLines.push(new Line(e[0], e[1], s[i + 1][0], s[i + 1][1], 0x20, true)));

				recordDistance = d;
				winningPath = nodes.slice();
			}
		};

		let tick = getTickCount();

		while (getTickCount() - tick < timeLimit) singleRun();

		return winningPath;
	};
	FastestPath.DebugLines = [];

	module.exports = function (dungeonName, Config, Attack, Pickit, Pather, Town, Misc) {
		// print('Running ' + dungeonName);

		// make copy of array
		let dungeons = AreaData.dungeons.hasOwnProperty(dungeonName) ? AreaData.dungeons[dungeonName] : [dungeonName];

		// strip leading areas, if we are already at that location
		let currentAreaIndex = dungeons.indexOf(me.area);
		if (currentAreaIndex > -1) {
			// Add to skip list
			dungeons.slice(0, currentAreaIndex).forEach(el => GameAnalyzer.skip.push(el));

			// Remove the area
			dungeons = dungeons.slice(currentAreaIndex);
		}


		// print(dungeons);
		const plot = Pather.plotCourse(dungeons.first(), me.area);
		if (!plot) throw Error('couldnt find path');

		if (plot.useWP) {
			Pather.useWaypoint(plot.course.first());
		} else if (plot.course.length) {
			console.debug('Adding areas to dungeon area, as we need to walk');

			plot.course.pop(); // the last is the first dungeon area, that is already in the list
			plot.course.reverse().forEach(el => dungeons.unshift(el));
		}

		dungeons.every((area, index, self) => {

			let actualDungeonArea = !!Object.keys(AreaData.dungeons).find(key => AreaData.dungeons[key].includes(area));
			let lastArea = index === self.length - 1;

			console.debug(actualDungeonArea ? 'Need to walk trough ' + AreaData[area].LocaleString : 'Clearing area ' + AreaData[area].LocaleString);

			// to be sure
			Pather.journeyTo(area);
			if (me.area !== area) return false;

			let targets = [], preset;

			// if this is a waypoint area, run to wards the waypoint
			if (Pather.wpAreas.includes(me.area) && !getWaypoint(me.area)) {
				const wpIDs = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539];
				for (let i = 0; i < wpIDs.length || preset; i += 1) {
					if ((preset = getPresetUnit(area, 2, wpIDs[i]))) {
						console.debug('Added waypoint to the list');
						targets.push(preset);
						break;
					}
				}
			}

			// if this isnt the last area of target, our goal is to run towards an exit
			if (!lastArea) {
				let area = getArea();

				let exits = area.exits;
				let exit = exits && exits.find(el => el.target === self[index + 1]);

				targets.push(exit);
			}

			const getExit = (id = 0) => getArea().exits.sort((a, b) => b - a).find(el => !id || el.target === id);
			const exitTarget = {};
			exitTarget[sdk.areas.BloodMoor] = sdk.areas.ColdPlains;
			exitTarget[sdk.areas.ColdPlains] = sdk.areas.StonyField;
			switch (area) {
				case sdk.areas.ColdPlains:
				case sdk.areas.BloodMoor: {
					if (lastArea) {
						// in the blood more, we simply wanna walk towards the otherside of it. In this case, cold plains
						console.debug('Now that we are here, just follow trough the exit - ' + AreaData[exitTarget[area]].LocaleString);
						const exit = getExit(exitTarget[area]);
						targets.push(exit);
					}
					break;
				}
			}

			const visitPresets = {};
			visitPresets[sdk.areas.Mausoleum] = [[1, 802], [2, 29]];

			if (visitPresets.hasOwnProperty(area)) {

				const visitNodes = visitPresets[area].map(getPresetUnit.bind(null, area)).map(preset => ({
					x: (preset.roomx * 5 + preset.x),
					y: (preset.roomy * 5 + preset.y),
				}));


				// calculate what is the shortest to walk between
				let nodes = FastestPath(visitNodes);

				let nearestNode = nodes.indexOf(nodes.slice().sort((a, b) => a.distance - b.distance).first());

				// If nearnest node isnt he first, we need to remove the index's in-front and push it to the end
				if (nearestNode > 0) for (let i = 0; i < nearestNode; i++) nodes.push(nodes.shift());

				// now the first node is the one most nearby, add them to targets, in-front of the line
				nodes.reverse().forEach(node => targets.unshift(node));
			}


			targets.forEach(target => {
				console.debug('Walking? -- '+target.x+', '+target.y);

				const path = getPath(me.area, target.x, target.y, me.x, me.y, Pather.useTeleport() ? 1 : 0, Pather.useTeleport() ? ([62, 63, 64].indexOf(me.area) > -1 ? 25 : 40) : 2);
				if (!path) throw new Error('failed to generate path');

				path.reverse();
				const lines = path.map((node, i, self) => i/*skip first*/ && new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x33, true));

				const pathCopy = path.slice();
				let loops = 0;
				for (let i = 0, node, l = path.length; i < l; loops++) {

					node = path[i];
					// console.debug('Moving to node ('+i+'/'+l+')');

					// if (!Pather.useTeleport()) {
					// 	const shortPath = getPath(me.area, node.x, node.y, me.x, me.y, 0, 1);
					// 	shortPath.reverse().forEach(shortNode => {
					// 		shortNode.moveTo();
					// 		clear({nodes: path});
					// 		Pickit.pickItems();
					// 	})
					//
					// } else {
						node.moveTo();
					// }

					// ToDo; only if clearing makes sense in this area due to effort
					clear({nodes: path});

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

				// if we are near a waypoint, click it if we dont got it yet

				if (target.hasOwnProperty('type')) {

					let wp = getUnit(2, "waypoint");
					if (wp && wp.mode !== 2) {
						wp.moveTo();
						Misc.poll(() => {
							wp.click();
							return getUIFlag(sdk.uiflags.Waypoint) || wp.mode !== 2;
						}, 6000, 30);

						getUIFlag(sdk.uiflags.Waypoint) && me.cancel();
					}
				}
			});

			GameAnalyzer.skip.push(area);

			switch (me.area) {
				case sdk.areas.DenOfEvil: {

					break;
				}
				case sdk.areas.TowerCellarLvl5: {
					// cunt-ress pwnage
					let poi = getPresetUnit(me.area, 2, 580);

					if (!poi) return false;

					switch (poi.roomx * 5 + poi.x) {
						case 12565:
							Pather.moveTo(12578, 11043);
							break;
						case 12526:
							Pather.moveTo(12548, 11083);
							break;
					}

					Attack.clear(20, 0, getLocaleString(2875)); // The Countess
				}
			}
			return true;
		});
	}

})(module, require);