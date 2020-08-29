(function (module, require) {

	const AreaData = require('../../../modules/AreaData');

	const Feedback = require('./Feedback');
	const GameAnalyzer = require('./GameAnalyzer');

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

			console.debug(actualDungeonArea ? 'Need to walk trough ' + AreaData[area].LocaleString : 'Going to area ' + AreaData[area].LocaleString);

			// to be sure
			Pather.journeyTo(area);
			if (me.area !== area) return false;

			let targets = [], preset;


			// if this is a waypoint area, run to wards the waypoint

			if (Pather.wpAreas.includes(me.area)) {
				const wpIDs = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539];
				for (let i = 0; i < wpIDs.length || preset; i += 1) {
					if ((preset = getPresetUnit(area, 2, wpIDs[i]))) {
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


			targets.forEach(target => {
				console.debug('Walking?');

				const path = getPath(me.area, target.x, target.y, me.x, me.y, Pather.useTeleport() ? 1 : 0, Pather.useTeleport() ? ([62, 63, 64].indexOf(me.area) > -1 ? 25 : 40) : 2);
				if (!path) throw new Error('failed to generate path');

				path.reverse();
				const pathCopy = path.slice();
				let loops = 0;
				for (let i = 0, node, l = path.length; i < l; loops++) {

					node = path[i];
					console.debug('Moving to node ('+i+'/'+l+')');
					node.moveTo();
					me.clear(8);

					// if this wasnt our last node
					if (l - 1 !== i) {

						// Sometimes we go way out track due to clearing,
						// lets find the nearest node on the path and go from there
						let nearestNode = pathCopy.sort((a, b) => a.distance - b.distance).first();

						// if the nearnest node is still in 95% of our current node, we dont need to reset
						if (nearestNode.distance > 5 && node.distance > 5 && 100 / node.distance * nearestNode.distance < 95) {

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