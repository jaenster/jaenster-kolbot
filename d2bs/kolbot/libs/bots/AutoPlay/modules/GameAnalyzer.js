/**
 * @description determin which area we wanna pwn
 * @Author Nishimura-Katsuo, Jaenster
 */
(function (module, require) {
	const GameData = require('../../../modules/GameData');
	const AreaData = require('../../../modules/AreaData');
	const QuestData = require('../../../modules/QuestData');

	const Feedback = require('./Feedback');

	/** @type {[Area, number]} */
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
	deltas.track(() => me.gold, Analyzer.updateDisplay);

	Analyzer.update();
	// })();

	const myData = module.exports = {
		skip: [sdk.areas.InnerCloister, sdk.areas.Tristram],
		areas: [],
		nowWhat: function (tmpSkip = [], comparedTo = undefined) {
			/**

			 The idea,

			 We know which area we can best do compared to density / skills / effort / gold / monster dmg
			 So we know which areas we want to go to

			 We know which quests need to be done for which area
			 So we calculate the quest we need to do

			 We know which quests depends on which quests
			 So we calculate the quest we need to do first

			 Do that, repeat.
			 */

			const bestArea = allareas
				// those with an area
				.filter(area => area[1])
				// those that are not on the skip list
				.filter((data) => !this.skip.includes(data[0].Index))

				// map to an effort list
				.map((data) => {
					const area = data[0],
						effortXP = data[1],
						canAccess = area.canAccess();

					let quest = undefined;

					if (!canAccess) {
						const areaId = area.Index;
						quest = QuestData.find(quest => quest.opensAreas.includes(areaId));
						if (quest) { // We cant find the quest we need to do for this area, wtf

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

							quest = questTree.first();
						}
					}

					return {
						area: area,
						/** @type number*/
						rating: effortXP,
						/** @type boolean*/
						canAccess: area.canAccess(),

						haveWaypoint: area.haveWaypoint(),

						/** @type string*/
						dungeon: Object.keys(AreaData.dungeons).find(key => AreaData.dungeons[key].includes(area.Index)),

						quest: quest,
					}

				}).find((cur, index, all) => {

					const bestChoice = all[0];
					const worseChoices = all.slice(index+1);

					// If a quest is needed to level here, check if that is something we desire
					if (cur.quest) {
						// do we find a no quest choice?
						let noQuestChoice = worseChoices.find(choice => !choice.quest);
						console.debug('Checking other area to be viable for avoiding quest '+(noQuestChoice && noQuestChoice.area.LocaleString));

						// Does the noQuestChoice give us atleast a 90% rating compared to the best choice?
						if (noQuestChoice && 100 / (bestChoice.rating) * noQuestChoice.rating > 90) {

							console.debug('Excluded ' + cur.area.LocaleString+' -- to avoid doing the quest. Stopped at'+noQuestChoice.area.LocaleString);
							// exclude this option, as something better is down the line
							return false;
						}
					}

					// we dont have waypoint to this area, see if we find something simular
					if (!cur.haveWaypoint) {
						// do we find a area we do have the waypoint of
						let waypointChoice = worseChoices.find(choice => !choice.haveWaypoint);
						console.debug('Checking other area to be viable for avoiding waypoint '+(waypointChoice && waypointChoice.area.LocaleString));

						// Does that come close to the area
						if (waypointChoice && 100 / (bestChoice.rating) * waypointChoice.rating > 90) {

							console.debug('Excluded ' + cur.area.LocaleString+' -- to avoid searching for waypoint. Stopped at'+waypointChoice.area.LocaleString);
							// exclude this option, as something better is down the line
							return false;
						}
					}

					// This area has no quest to do, yet cant access
					if (!cur.canAccess && !cur.quest) {
						// Should not happen
						console.debug('Excluded '+ cur.area.LocaleString+' -- area inaccessible');
						return false;
					}

					return true;
				});

			if (!bestArea) {// we just dont know anymore
				return false;
			}


			if (bestArea.quest) {// if a quest is needed, we do that first. After that we look again what is best
				console.debug('---------- quest ', bestArea.quest);

				// the end goal quest
				Feedback.quest = QuestData.find(quest => quest.opensAreas.includes(bestArea.area.Index));


				return ['quest', bestArea.quest, bestArea.rating];
			}

			if (bestArea.dungeon) {// if a dungeon needs to be cleared, that is what we do
				console.debug('--------- dungeon -- ',bestArea.dungeon);
				return ['dungeon', bestArea.dungeon, bestArea.rating];
			}

			console.debug('--------- clear -- ', bestArea.area.LocaleString);
			return ['clear', bestArea.area, bestArea.rating];
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