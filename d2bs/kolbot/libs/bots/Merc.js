/**
 * @description A script that follows a char around as a merc
 * @author Jaenster
 *
 * @config
 Config.Merc = {
          mercOf: 'profile', // With mercOf: false, but the merc script on true it is the char that is being merc'd
          settings: {
                Attack: true, // make a bot attack
          }
    }
 */

/** @type boolean|(function(*=, *=, *): void) me*/
const Merc = (function () {
		if (getScript(true).name.toString() !== 'default.dbj') return false;

		// pickit after doing chores
		(_ => Town.doChores = new Function('return ' + _.toString().replace(/this\./gi, 'Town.').replace('return true;', 'return Pickit.pickItems()'))())(Town.doChores);

		// Override Misc.errorReport as i want stack info as well.
		(_ => Misc.errorReport = new Function('return ' + _.toString().replace(/this\./gi, 'Misc.').replace('print(msg);', "print(msg);typeof error === 'object' && print(error.stack);"))())(Misc.errorReport);

		// Here some crap that i want to use.
		const Promise = require('Promise');

		// Do we want to teleport or walk?
		const useTeleport = () => Pather.teleport && !me.getState(139) && !me.getState(140) && !me.inTown && ((me.classid === 1 && me.getSkill(54, 1)) || me.getStat(97, 54));

		const getCharByProfileName = (profile = config.mercOf) => {
			let filename = 'data/' + profile + '.json',
				string = Misc.fileAction(filename, 0),
				obj = JSON.parse(string);
			return obj && obj.hasOwnProperty("name") && obj.name;
		};

		const bestSpot = (unit, distance) => {
			let n, i, coll = 0x04,
				coords = [],
				fullDistance = distance,
				angle = Math.round(Math.atan2(me.y - unit.y, me.x - unit.x) * 180 / Math.PI),
				angles = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 135, -135, 180];

			for (n = 0; n < 3; n += 1) {
				n > 0 && (distance -= Math.floor(fullDistance / 3 - 1));

				angles.forEach(c => ((cx, cy) => Pather.checkSpot(cx, cy, 0x1, false)
					&& coords.push({
						x: cx,
						y: cy
					}))
					(
						Math.round((Math.cos((angle + c) * Math.PI / 180)) * distance + unit.x),
						Math.round((Math.sin((angle + c) * Math.PI / 180)) * distance + unit.y)
					)
				);
			}
			coords.sort(Sort.units);

			return coords.find(c => !CollMap.checkColl({x: c.x, y: c.y}, unit, coll, 1));
		};
		const getUnits = (...args) => {
			let units = [], unit = getUnit.apply(undefined, args);

			if (unit instanceof Unit) {
				do {
					unit && units.push(copyUnit(unit));
				} while (unit.getNext());
			}

			return units;
		};

		const Util = {
			talkTo: function (name) { // Credit to Jean Max for this function: https://github.com/JeanMax/AutoSmurf/blob/master/AutoSmurf.js#L1346
				let npc, i;

				!me.inTown && Town.goToTown();

				for (i = 5; i; i -= 1) {
					Town.move(name === "jerhyn" ? "palace" : name);
					npc = getUnit(1, name === "cain" ? "deckard cain" : name);
					if (npc && npc.openMenu()) {
						me.cancel();
						return true;
					}
					Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
				}

				return false;
			},
		};
		const promiseInTown = () => new Promise(resolve => me.inTown && resolve());
		const getLeaderParty = function () {
			let player = getParty();
			if (player) for (; player.getNext();) if (player.name === leaderName) return player;
			return false;
		};
		const getLeaderUnit = function (name = leaderName) {
			var player = getUnit(0, name);

			if (player) {
				do {
					if (!player.dead) {
						return player;
					}
				} while (player.getNext());
			}

			return false;
		};
		let leaderParty, leaderUnit, leaderName = getCharByProfileName();

		const ret = function (Config, Attack) {
			print = debug;

			Worker.runInBackground['waypointGetter'] = function () {
				let wp = getUnit(2, "waypoint");
				wp && !getWaypoint(Pather.wpAreas.indexOf(wp.area)) && wp.moveTo() && wp.interact(); // click the bloodly waypoint if we dont have it yet

				return true; // always keep running;
			};


			me.ignoreMonster = []; // List of monsters we gonna ignore somehow
			// Override some functions. For better support of low level botting

			// Taking care of quests
			let questsHandlers = { // function gets called upon quest change
				// It only comes in the handler if something is changed.
				// So for old, done quests, this is pointless and therefor no need to check

				// Den of evil is quest 1. Something is changed. If finished, talk to akara once we are in town
				1: states => states[0] && promiseInTown().then(() => Town.goToTown(1) && Util.talkTo('Akara')),

				// Sisters burial, andy
				15: states => states[0] && promiseInTown().then(function () {
					// We are in town now
					Town.goToTown(1); // If you just finished andy, act 1 is the only you have, but still
					// Move close to warrive

					Town.move("warriv");
					let npc = getUnit(1, "warriv");
					if (!npc) return; // failed talking to warriv
					sendPacket(1, 0x31, 4, npc.gid, 4, 183);  // send quest msg, talked to warriv
					delay(me.ping);
					npc.openMenu() && Misc.useMenu(0x0D36);
					delay(me.ping);
				})(),


				//

			}, oldQuestState = {}, getQuests = (q, newQuest = []) => {
				for (let y = 0; y < 100; y++) newQuest.push(me.getQuest(q, y));
				return newQuest;
			};

			Worker.runInBackground['questing'] = function () {
				for (let q = 0; q < 44; q++) {
					if (!questsHandlers.hasOwnProperty(q)) continue; // only for those i have handers for
					// If old quest state isnt known yet. Fill it in
					if (!oldQuestState.hasOwnProperty(q)) oldQuestState[q] = getQuests(q);

					let newQuestStates = getQuests(q);
					!newQuestStates.isEqual(oldQuestState[q]) && questsHandlers[q](newQuestStates); // Something is changed, call the handler
				}
			};

			// Setting up some class specific's
			switch (me.classid) {
				case 0: // Amazon
					ClassAttack.doAttack = function (unit) {
						// Typical merc check
						if (Config.MercWatch && Town.needMerc()) {
							Town.visitTown();
						}

						if (getTickCount() - vault.timer > 1000) {
							// Get list of nearby monsters
							let monster = getUnit(1), monsters = [copyUnit(unit)], currentMonster;

							do {
								currentMonster = copyUnit(monster);

								// If monsters are near eachother
								if (Attack.checkMonster(currentMonster)
									&& getDistance(currentMonster, unit) < 7 // Distance between monster and monster are low
								//&& checkCollision(monster, unit, 0x4) // As long there are no collisions between monster and monster
								//&& Attack.checkResist(currentMonster, Skill.LightningFury) // and accually can be attacked
								) {
									monsters.push(currentMonster);
								}
							} while (monster.getNext());

							if (monsters.length > 3) { // if 3 or more monsters are around the unit (the unit itself is included in the list)
								print('Fury!');
								monsters.sort(Sort.units); // Get the one that the most close to me
								vault.timer = getTickCount();
								Skill.cast(35, 0, monsters[0]); // Cast fury
								// Continue with normal attack sequence now
							}
						} else {
							print('Skipping fury atm');
						}

						// Get timed skill
						let checkSkill = 24;

						if (Math.round(getDistance(me, unit)) > Skill.getRange(checkSkill) || checkCollision(me, unit, 0x4)) {
							if (!Attack.getIntoPosition(unit, Skill.getRange(checkSkill), 0x4)) {
								return 0;
							}
						}

						// check resistance for charged strike
						if (!Attack.checkResist(unit, checkSkill)) {
							checkSkill = 10; // Jab if we cant use lighting
						}

						return Skill.cast(checkSkill, 1, unit);
					};
					break;
				case 1: // Sorc
					break;
				case 2: // Necromancer
					Precast.doPrecast(); // only bone armor
					ClassAttack.checkCorpse = (unit, revive) => {
						if (unit.mode !== 12) return false;

						var baseId = getBaseStat("monstats", unit.classid, "baseid"),
							badList = [312, 571];

						if (
							(
								(unit.spectype & 0x7)
								|| badList.indexOf(baseId) > -1
								|| (Config.ReviveUnstackable && getBaseStat("monstats2", baseId, "sizex") === 3)
							) || !getBaseStat("monstats2", baseId, revive ? "revive" : "corpseSel")
						) {
							return false;
						}

						return getDistance(me, unit) <= 40 && !checkCollision(me, unit, 0x4) &&
							!unit.getState(1) && // freeze
							!unit.getState(96) && // revive
							!unit.getState(99) && // redeemed
							!unit.getState(104) && // nodraw
							!unit.getState(107) && // shatter
							!unit.getState(118);
					};

					// A necromancer works best if it attacks multiple units, so we gonna ignore mostly the unit flag
					ClassAttack.doAttack = function (unit) {
						// recast bone armor if gone
						!me.getState(14) && Skill.cast(68);


						let corpse = getUnit(1, -1, 12),
							range = Math.floor((me.getSkill(74, 1) + 7) / 3), exploded;

						if (corpse) {
							let exploded = false;
							do {
								if (getDistance(unit, corpse) <= range && this.checkCorpse(corpse)) {
									Skill.cast(74, 0, corpse);
									print('Explodeded ' + corpse.name);
									exploded = true;
								}
							} while (corpse.getNext());
						}

						// If nothing else is left, just attack
						(id => Skill.cast(Config.AttackSkill[id], 1, unit))(unit.spectype & 0x7 && 1 || 3);
						return false; // move to the next unit
					};
					break;
				case 3: // Paladin
					Precast.doPrecast(); // only bone holyshield
					break;
				case 4: // Barb
					break;
				case 5: // Druid
					//ToDo; Figure out skill of oak at the moment, recast after it got a bo
					Precast.doPrecast(); // Better to have already oak in town
					break;
				case 6: // Assasin
					break;
			}

			me.__defineGetter__('actOfLeader', function () {
				switch (true) {
					// ignore non objects and null
					case typeof leaderParty !== 'object' || !leaderParty:
					// in case area isnt set
					case !leaderParty.hasOwnProperty('area') || !leaderParty.area:
						return 0; // unknown yet
					case leaderParty.area < 40:
						return 1;
					case leaderParty.area < 75:
						return 2;
					case leaderParty.area < 103:
						return 3;
					case leaderParty.area < 109:
						return 4;
					default:
						return 5;
				}
			});

			// Some decent death handler
			const deathHandler = () => new Promise(resolve => me.dead && resolve()).then(function () {
				let [x, y, area] = [me.x, me.y, me.area];
				new Promise(resolve => !me.dead && me.area === area && getDistance(me, x, y) < 40 && resolve())
					.then(function () {
						// Close to an body of ours. Lets pick it up and deal with it
						Pather.moveTo(x, y); // Move to body
						try {
							Town.getCorpse();
							me.deathCount--;
						} catch (e) {
							Misc.errorReport(e, 'DeathHandler');
						}
					});

				// Init variable that counts our deaths
				typeof me.deathCount === 'undefined' && (me.deathCount = 0)
				// If we have 10 corpeses laying around, quit the game
				(++me.deathCount > 10) && quit() && false || getScript().stop(); // To prevent future code execution

				_delay(2000); // wait a sec
				me.revive(); // revive

				// restart the entire death handler code
				deathHandler();
			});
			deathHandler();


			// @ToDo write a bunch of promises that handle with quest changes, and react on it.
			// Always just click the waypoint
			(function () {
				Town.move("waypoint");
				let wp = getUnit(2, "waypoint");
				wp && wp.moveTo();
				wp.interact(); // click the bloodly waypoint
			})();

			Town.doChores();

			let spamTick = 0;
			while (true) {
				if (++spamTick > 100) {
					print('test');
					spamTick = 0;
				}
				delay(10);

				!leaderName && (leaderName = getCharByProfileName());
				if (!leaderName) continue;

				leaderParty = getLeaderParty();
				if (!leaderParty || !leaderParty.area) continue;

				// If we are not in the same location as the leader
				if (me.area !== leaderParty.area) {
					let area = getArea(), exit, portal, portals = [];
					exit = area && (((exits) => exits && exits.find(x => print(x.target) || x.target === leaderParty.area))(area.exits));

					//ToDo; build in check it doesnt follow outside of town, after act 2 (normal), for act 3+ and nightmare/hell ignore this.
					// if we found the exit, we move to the exit itself
					if (exit) {
						Pather.moveToExit([leaderParty.area], true);
						if (leaderParty.area === me.area) continue;
					}

					//ToDo; Check stuff like throne -> chamber, or arcane -> canon
					switch (true) {
						case leaderParty.area === sdk.areas.WorldstoneChamber && me.area === sdk.areas.ThroneOfDestruction:
							// ToDo; write the crap to switch to chamber
							break;
					}

					//Check if we can reach the area by waypoint
					if (me.inTown && getWaypoint(Pather.wpAreas.indexOf(leaderParty.area))) {
						print(leaderParty.x + ',' + leaderParty.y);
						// Take waypoint
						Pather.useWaypoint(leaderParty.area);
						if (leaderParty.area === me.area) continue;
					}

					print('Not in the same area');
					// If not in town, go to town
					if (!me.inTown) {
						print(me.act);
						let acts = [, 1, 40, 75, 103, 109],
							target = acts[me.act];
						portal = getUnits(2, "portal").filter(p => !p.getParent() || p.getParent() === me.charname || Misc.inMyParty(p.getParent()).first()),
							wp = getUnits(2, "waypoint").filter(x => x.area === me.area).first();

						// Take a waypoint to town
						wp && print('taking waypoint?');
						print(target);
						if (wp && Pather.useWaypoint(target)) continue;

						// If a portal is up to town, take it
						if (portal && Pather.usePortal(null, null, portal)) {
							print('portal up?');
							continue;
						}

					}


					// Move to the correct town of leader
					me.act !== me.actOfLeader && me.actOfLeader && Town.goToTown(me.actOfLeader) && Town.move('portalspot');

					//Take a direct portal of the leader, if we can
					if (!(me.inTown && Town.move('portalspot') && Pather.usePortal(leaderParty.area, leaderName))) continue;

					// It can also be that a portal is up, to the previous location, so may can walk.
					portal = getUnit(2, "portal");

					// Generate list of portals
					if (!portal) continue;
					for (; portal.getNext();) portals.push(copyUnit(portal));

					print('here');
					portals = portals
						.filter(p => p) // Only real portals (yes this is needed)
						// Only parentless portals, or my portals, or a portal from someone that is in my party
						.filter(p => !p.getParent() || p.getParent() === me.charname || Misc.inMyParty(p.getParent()))
						// Now filter out portals that are connected to the area of my leader
						.filter(portal => {
							print('looking for relative close portalz');
							// Get the location of the portal
							let portalArea = portal.objtype;
							if (portalArea === leaderParty.area) return true; // obv a portal straight to the leader is what we prefer

							let targetAreaObj = getArea(portalArea);
							print(JSON.stringify(targetAreaObj.exits));
							return targetAreaObj && targetAreaObj.exits && Array.isArray(targetAreaObj.exits) && targetAreaObj.exits.indexOf(exit => exit.area === portalArea) > -1;
						});
					//ToDo; sort obviously correctly.
					// .sort((a,b) => a-b);

					// Just take the portal, the rest of the script takes care of moving close to the char.
					portals.length && (Pather.usePortal(portal.first()));

				}

				// Aslong we are in town, try to use the portal of leader, or continue;
				if ((me.inTown && Town.move('portalspot') && Pather.usePortal(leaderParty.area, leaderName))) continue;

				// Using a portal can take a second for everything to update. If still report to be not in the same area, continue;
				if (me.area !== leaderParty.area) continue;

				// We are in the same area of leader
				leaderUnit = getLeaderUnit();

				// Inside of a function here so i can return, to break the while loop, as it is the last statement of the while loop
				(function () {
					// move closer to leader, recheck position every step
					if (!leaderUnit) for (; !(leaderUnit = getLeaderUnit() && leaderUnit.distance < 20);) {
						let path = getPath(leaderParty.area, me.x, me.y, leaderParty.x, leaderParty.y, Pather.useTeleport && 1 || 0, Pather.useTeleport && ([62, 63, 64].indexOf(me.area) > -1 || 30 && Pather.teleDistance) || Pather.walkDistance);
						if (!path || (!path && leaderParty.area !== me.area) || path.length === 0) return;

						path.shift(); // Ignore the first as it is on "me"
						path = path.shift();
						if (path) {
							print('me: ' + me.x + ',' + me.y);
							print('path: ' + path.x + ',' + path.y);
							new Line(me.x, me.y, path.x, path.y, 0x84, true);

							if (getDistance(leaderParty.x, leaderParty.y, me.x, me.y) < 5) return;
							(useTeleport() && Pather.teleportTo || Pather.walkTo).apply(Pather, [path.x, path.y]);
						}
					}

					// I have guarantied a leader unit here, yet i prefer to check it as it prevents potential bugs. Rather write too safe code as unsafe code
					if (!leaderUnit) return;
					/** @type Unit leaderUnit */
				})();

				// ToDo; blindly assuming i need to attack now.
				leaderUnit && leaderUnit.clear(25)

			}
		};


		return ret;
	}
).call();

