(function (module, require) {

	const AreaData = require('../../../modules/AreaData');
	const walkTo = require('./WalkTo');
	const GameAnalyzer = require('./GameAnalyzer');


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
				console.debug('Walking? -- ' + target.x + ', ' + target.y+' , '+target.distance);

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
				case sdk.areas.DenOfEvil: {
					if (me.getQuest(1, 0)) break;
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


					const clear = require('./clear');
					let _cacheRange = clear.defaults.range;
					clear.defaults.range = 20;

					rooms.some(node => {
						walkTo(node);
						return me.getQuest(1, 0);
					});

					clear.defaults.range = _cacheRange;

					break;
				}
				case sdk.areas.TowerCellarLvl5: {
					// cunt-ress pwnage
					let poi = getPresetUnit(me.area, 2, 580);

					if (!poi) return false;
					let target = {x: 12578, y: 11043};

					if (poi.roomx * 5 + poi.x === 12526) target = {x: 12548, y:11083};

					walkTo(target);

					const cuntress = getUnits(2).filter(unit=>unit.name === getLocaleString(2875)).first();

					cuntress.clear(20);
					cuntress.kill();
					break;
				}

				// If we came here to level, we might as well fix the amulet
				case sdk.areas.MaggotLairLvl3: {

					let poi = getPresetUnit(sdk.areas.MaggotLairLvl3, 2, 356).realCoords();
					walkTo(poi);
					me.getQuestItem(92, 356);

					break;
				}
			}
			return true;
		});
	}

})(module, require);