(function (module, require) {

	const AreaData = require('../../../modules/AreaData');
	const walkTo = require('./WalkTo');
	const GameAnalyzer = require('./GameAnalyzer');
	const CustomDungeon = require('./CustomDungeon');


	const FastestPath = (nodes, timeLimit = 250) => {
		nodes = nodes.filter(_ => _ && _.hasOwnProperty('x') && _.hasOwnProperty('y'));
		const hooks = [];

		const calcDistance = () => {
			let sum = 0;
			for (let i = 1; i < nodes.length; i++) {
				sum += getPath(me.area, nodes[i - 1].x, nodes[i - 1].y, nodes[i].x, nodes[i].y, 0, 25)
					.map((el, i, self) => i && getDistance(el.x, el.y, self[i - 1].x, self[i - 1].y) || 0)
					.reduce((acc, cur) => acc + cur, 0);

			}
			return sum;
		};


		let recordDistance = calcDistance();
		let winningPath = nodes.slice(); // current

		let x, y, d;
		const singleRun = () => {
			x = rand(1, nodes.length) - 1;
			y = rand(1, nodes.length) - 1;

			if (x === y) return;

			const tmp = nodes[x];
			nodes[x] = nodes[y];
			nodes[y] = tmp;

			hooks.forEach(line => line.remove());

			d = calcDistance();

			if (d < recordDistance) {
				console.debug('Winning path?');
				recordDistance = d;
				winningPath.forEach(() => winningPath.pop());
				nodes.forEach(node => winningPath.push(node));
			}
		};

		let tick = getTickCount();

		console.debug('Fastest path');
		while (getTickCount() - tick < timeLimit) singleRun();

		return {
			winningPath: winningPath,
			singleRun: singleRun,
		};
	};
	FastestPath.DebugLines = [];

	module.exports = function (dungeonName, Config, Attack, Pickit, Pather, Town, Misc) {
		const wantToSell = () => {
			let isLowOnGold = me.gold < Config.LowGold;
			console.debug('Low on gold =O');

			let reasonsToShop = [0, -1];
			if (isLowOnGold) reasonsToShop.unshift(4);

			return (me.getItems() || [])
				.filter(el => el.location === sdk.storage.Inventory)
				.some(item => reasonsToShop.includes(Pickit.checkItem(item)));
		};
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

		if (plot.useWP && plot.course.first() !== me.area) {
			console.debug('Gonna use waypoint..?');
			Pather.getWP(plot.course.first());
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

			const custom = CustomDungeon.getArea(area);
			if (custom) {

				custom.run();
				GameAnalyzer.skip.push(area);

			} else {
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

					if (exit) {
						exit.isExit = true;
						targets.push(exit);
					}
				}

				const getExit = (id = 0) => (getArea().exits || []).sort((a, b) => b - a).find(el => !id || el.target === id);
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
							if (exit) {
								exit.isExit = true;
								targets.push(exit);
							}
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
					let nodes = FastestPath(visitNodes).winningPath;

					let nearestNode = nodes.indexOf(nodes.slice().sort((a, b) => a.distance - b.distance).first());

					// If nearnest node isnt he first, we need to remove the index's in-front and push it to the end
					if (nearestNode > 0) for (let i = 0; i < nearestNode; i++) nodes.push(nodes.shift());

					// now the first node is the one most nearby, add them to targets, in-front of the line
					nodes.reverse().forEach(node => targets.unshift(node));
				}

				targets.forEach(target => {
					console.debug('Walking? -- ' + target.x + ', ' + target.y + ' , ' + target.distance);

					walkTo(target);

					if (target.hasOwnProperty('isExit') && target.isExit) {
						const currExit = target;

						if (currExit.type === 1) {// walk through

							let targetRoom = Pather.getNearestRoom(currExit.target);
							if (targetRoom) targetRoom.moveTo();

						} else if (currExit.type === 2) {// stairs
							!Pather.openExit(currExit.target) && !Pather.useUnit(5, currExit.tileid, currExit.target);
						}

					}

					// if we are near a waypoint, click it if we dont got it yet
					if (target.hasOwnProperty('type')) {

						let wp = getUnit(2, "waypoint");
						if (wp && wp.mode !== 2) {
							wp.moveTo();
							Misc.poll(() => {
								wp.click();
								return getUIFlag(sdk.uiflags.Waypoint) || wp.mode !== 2;
							}, 6000, 30);

							console.debug('wanna go to town?');
							if (wantToSell()) {
								console.debug('wanna go home');
								// take wp to local town
								Pather.useWaypoint(AreaData[me.area].townArea().Index);

								const npc = Town.initNPC("Shop", "identify");
								if (npc) {
									console.debug('sell the crap');
									Town.identify();
								}

								Pather.useWaypoint(area);

							}

							getUIFlag(sdk.uiflags.Waypoint) && me.cancel();
						}
					}
				});

				GameAnalyzer.skip.push(area);

				switch (me.area) {

					// If we came here to level, we might as well fix the amulet
					case sdk.areas.MaggotLairLvl3: {



						break;
					}
				}
			}



			return true;
		});
	}

})(module, require);