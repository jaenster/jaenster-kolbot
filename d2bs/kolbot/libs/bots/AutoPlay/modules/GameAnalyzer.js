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
				areas = allareas.filter(area => area[1] && (me.diff < 2 || area[0].Level >= minlevel && area[1] <= maxattacks)).slice(0, 20);
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
		nowWhat: function (tmpSkip=[],comparedTo=undefined) {
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

			const areas = allareas.filter(area => area[1] && (me.diff < 2 || area[0].Index >= 0));
			for (let i = 0; i < areas.length; i++) {
				// Got an area
				const [area, effortXp] = areas[i];

				if (this.skip.includes(area.Index)) continue; // Nope
				if (tmpSkip.includes(area.Index)) continue; // Nope

				// Can we go to this area?
				const canAccess = area.canAccess();
				console.log('Looking at area ' + area.LocaleString + ' ('+Math.round(effortXp*100)/100+')');

				tmpSkip.push(area.Index);

				// Found an area we can access, and gives allot of xp
				if (canAccess) {

					// Is this area part of an dungeon?
					let dungeonsKey = Object.keys(AreaData.dungeons).find(key => AreaData.dungeons[key].includes(area.Index));

					// before saying we want to do this dungeon, lets see if our second best option is as viable as this
					if (!area.haveWaypoint()) {
						let copy = tmpSkip.slice();

						if (dungeonsKey) {
							AreaData.dungeons[dungeonsKey].forEach(el => copy.push(el));
						} else {
							copy.push(area.Index);
						}



						const result = this.nowWhat(copy,comparedTo||effortXp);
						if (result && result.length >= 3) {
							const [type,what,otherXp] = result;

							const otherArea = type === 'clear' ? what : AreaData[AreaData.dungeons[what].first()];

							let otherName = (type === 'clear' ? what.LocaleString : what);
							// another area only make sense if we do have that waypoint
							if (!otherArea.haveWaypoint()) {
								Feedback.lastDecision = 'Should do '+((dungeonsKey || area.LocaleString));
								console.debug(otherName + ' is not a valid option as we dont have that waypoint either');
							} else if ( 100 / (effortXp||comparedTo) * otherXp > 90) {
								console.debug(otherName+' is a better idea as '+(dungeonsKey || area.LocaleString));
								Feedback.lastDecision = 'Should do '+otherName;
								return [type,what,otherXp];
							} else {
								console.debug(otherName + ' is not a valid option');
							}
						}
					}

					if (dungeonsKey) {
						/** @type [Area, number][]*/
						let dungeonAreas = allareas.filter(([a]) => AreaData.dungeons[dungeonsKey].includes(a.Index));

						// Calculate if every dungeon listed here gives atleast that much xp?
						if (dungeonAreas.every(([a, curxp]) => !curxp || 100 - (100 / effortXp * curxp) < 30)) {

							Feedback.lastDecision = 'Do dungeon '+dungeonsKey;
							// This entire dungeon is an good idea
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

				// print('---- Quest tree we need to do to level @ ' + area.LocaleString);
				// questTree.map(q => q.name).join(' --> ');
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