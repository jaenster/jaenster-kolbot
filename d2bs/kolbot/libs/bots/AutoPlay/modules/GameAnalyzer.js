/**
 * @description determin which area we wanna pwn
 * @Author Nishimura-Katsuo, Jaenster
 */
(function (module, require) {
	const GameData = require('../../../modules/GameData');
	const AreaData = require('../../../modules/AreaData');
	const QuestData = require('../../../modules/QuestData');

	const Feedback = require('./Feedback');

	let allareas = [];
	const Analyzer = new function () {
		this.setupState = false;
		let excluded = [0, /*26, 32, 39, 45, 73, 82, 93, 94, 95, 96, 97, 98, 99, 120, */133, 134, 135, 136], txt;

		let keyEvent = scanCode => {
			if (scanCode === 111 && me.ingame && me.gameReady) { // numpad /
				txt.visible = !txt.visible;
				this.update();
			}
		};

		let setup = () => {
			if (this.setupState) {
				return;
			}


			print("Setting up Analyzer...");

			if (!txt) {
				txt = new Text('Loading...', 10, 485, 0, 6, 0, false);
			} else {
				txt.visible = false;
			}

			addEventListener("keyup", keyEvent);
			this.setupState = true;
		};

		let teardown = () => {
			if (!this.setupState) {
				return;
			}

			print("Tearing down Analyzer...");

			removeEventListener("keyup", keyEvent);
			txt.visible = false;
			this.setupState = false;
		};

		this.updateDisplay = () => {
			if (txt && !txt.visible) {
				return;
			}

			let maxattacks = 1, minlevel = 85, areas, currentexp = 0;

			allareas.forEach(area => {
				if (me.area === area[0].Index) {
					currentexp = area[1];
				}
			});

			do {
				minlevel--;
				maxattacks *= 2;
				areas = allareas.filter(area => area[1] && (me.diff < 2 || area[0].Level >= minlevel && area[1] <= maxattacks)).slice(0, 4);
			} while (areas.length < 1 && minlevel > 0);

			let outtxt = (me.diff < 2 ? "Top XP Areas (Current " : "Low Effort Areas (Current ") + currentexp.toFixed(1) + "):";
			areas.forEach(area => {
				let dname = area[0].LocaleString;
				outtxt = "(" + area[0].Level + ", " + area[1].toFixed(2) + ") " + dname + "\n" + outtxt;
			});

			if (txt.text !== outtxt) {
				txt.text = outtxt;
			}
		};

		this.update = () => {
			if (txt && !txt.visible) {
				return;
			}

			if (me && me.gid && me.ingame && me.gameReady && me.area) {
				setup();

				try {
					if (txt.visible) {
						allareas = AreaData.map(area => {
							let exp = me.diff < 2 ? GameData.areaSoloExp(area.Index) : GameData.areaEffort(area.Index);

							return [area, exp];
						}).sort(me.diff < 2 ? ((a, b) => b[1] - a[1]) : ((a, b) => a[1] - b[1])).filter(area => excluded.indexOf(area[0].Index) < 0);
					}
				} catch (err) {
					Misc.errorReport(err, 'Analyzer');
				}
			} else {
				teardown();
			}

			this.updateDisplay();
		};
	};


	// (() => { // Which are the updates
	const Delta = require('../../../modules/Deltas');
	const deltas = new Delta();
	deltas.track(() => me.charlvl, Analyzer.update);

	[sdk.stats.PassiveFireMastery, sdk.stats.PassiveLightningMastery, sdk.stats.PassiveColdMastery, sdk.stats.PassivePoisonMastery,
		sdk.stats.PassiveFirePierce, sdk.stats.PassiveLightningPierce, sdk.stats.PassiveColdPierce, sdk.stats.PassivePoisonPierce,
		sdk.stats.PassiveMagMastery, sdk.stats.PassiveMagPierce
	].forEach(el => deltas.track(() => me.getStat(el), Analyzer.update));

	deltas.track(() => JSON.stringify(me.getSkill(4)), Analyzer.update); // all skills
	deltas.track(() => me.area, Analyzer.updateDisplay);

	Analyzer.update();
	// })();

	const myData = module.exports = {
		skip: [sdk.areas.InnerCloister],
		areas: [],
		nowWhat: function (tmpSkip=[]) {
			/**

			 The idea,

			 We know which area we can best do compared to density / skills / effort
			 So we know which areas we want to go to

			 We know which quests need to be done for which area
			 So we calculate the quest we need to do

			 We know which quests depends on which quests
			 So we calculate the quest we need to do first

			 Do that, repeat.
			 */


			const Pather = require('../../../modules/Pather');

			// If we cant see we have the waypoint of act 1, we didnt interact with any WP yet
			if (!getWaypoint(1)) Pather.useWaypoint(null);

			const areas = allareas.filter(area => area[1] && (me.diff < 2 || area[0].Index >= 0));
			for (let i = 0; i < areas.length; i++) {
				// Got an area
				const [area, effortXp] = areas[i];

				if (this.skip.includes(area.Index)) continue; // Nope
				if (tmpSkip.includes(area.Index)) continue; // Nope

				// Can we go to this area?
				const canAccess = area.canAccess();
				console.log('Looking at area ' + area.LocaleString);

				// Found an area we can access, and gives allot of xp
				if (canAccess) {
					let dungeonsKey = Object.keys(AreaData.dungeons).find(key => AreaData.dungeons[key].includes(area.Index));
					if (dungeonsKey) {
						console.log('Looking at dungeons ' + dungeonsKey);

						/** @type [Area, number][]*/
						let dungeonAreas = allareas.filter(([a]) => AreaData.dungeons[dungeonsKey].includes(a.Index));

						// Calculate if every dungeon listed here gives atleast that much xp?
						if (dungeonAreas.every(([a, curxp]) => !curxp || 100 - (100 / effortXp * curxp) < 30)) {
							// This entire dungeon is an good idea


							// before saying we want to do this dungeon, lets see if our second best option is as viable as this
							if (!area.haveWaypoint()) {

								console.debug('Want to do dungeon, but we dont have waypoint. Seeing other options');
								let copy = tmpSkip.slice();

								dungeonAreas.forEach(el => copy.push(el[0].Index));

								console.debug(copy);
								delay(1000);
								const result = this.nowWhat(copy);
								if (result && result.length >= 2) {
									const [type,what,otherXp] = result;
									if (100 / effortXp * otherXp > 70) {
										console.debug('Going with other option instead');
										return [type,what,otherXp];
									}
								}
							}

							return ['dungeon', dungeonsKey, effortXp];
						}
					} else {
						return ['clear', area, effortXp];
					}

				}

				// We need to do some questing before we can go here
				const areaId = area.Index;
				const quest = QuestData.find(quest => quest.opensAreas.includes(areaId));
				if (!quest) continue; // We cant find the quest we need to do for this area, wtf

				// the quest we wanna work to
				Feedback.quest = quest;

				const questTree = [quest];
				// For each prerequisites we need to see recursively if we need to do the previous onem

				(function addPre(quest) {
					return quest.prerequisites.forEach((q) => {
						const quest = QuestData.find(quest => quest.index === q);

						if (!me.getQuest(quest.index, 0) && !questTree.includes(quest)) {

							questTree.unshift(quest);
							addPre(quest) // recursively call this crap
						}
					});
				})(quest);

				//ToDo; buildin some magic here to calculate if this is too much to handle for now
				const wantedQuest = questTree.first();
				if (!wantedQuest) continue; // cant figure out what we want

				print('---- Quest tree we need to do to level @ ' + area.LocaleString);
				questTree.map(q => q.name).join(' --> ');
				return wantedQuest && ['quest', wantedQuest]
			}
		},
		bestAreaXP: () => {
			const highestQuest = GameData.Quests;
			let winner = Infinity, best = -Infinity;

			for (let i = 0; i < allareas.length; i++) {
				const [area, score] = allareas[i];

				// Determin the best area, we can go to
				if (score > best) {
					// Lets see if we can actually go there, as in if we have the quest


					// Lets see if we can go there,
					best = score;
					winner = area;
				}
			}

			print('Should go pwn ' + JSON.stringify(winner));
		},
	};

	Object.defineProperty(module.exports, 'areas', {
		get: function () {
			return allareas.filter(area => area[1] && (me.diff < 2 || area[0].Level >= minlevel && area[1] <= maxattacks))
		}
	});

})(module, require);