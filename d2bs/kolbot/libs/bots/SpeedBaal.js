/**
 * @description A baalrun made for speed, not for mf
 * @author Jaenster
 */
(function (module, require) {
	const Messaging = require('Messaging');
	const Delta = new (require('Deltas'));
	switch (getScript.startAsThread()) {
		case 'thread':
			let tick, oldtick, diaReady = false;
			tick = oldtick = 0;

			addEventListener('gamepacket', bytes => bytes
				&& bytes.length
				&& (
					(
						bytes[0] === 0xA4 // baal laughs
						&& (tick = getTickCount())
					) || (
						bytes[0] === 0x89 // All seals and monsters done
						&& (diaReady = true)
					)
				) && false);

			Delta.track(() => tick, () => Messaging.send({SpeedBaal: {baalTick: tick}}) || print('Baal laughed'));
			Delta.track(() => diaReady, () => Messaging.send({SpeedBaal: {diaReady: diaReady}}) || print('Dia ready'));

			//ToDo stop once baal is finished
			while (me.ingame) delay(1000); // Just idle
			break;
		case 'loaded':
		case 'started':
			const SpeedBaal = function (Config, Attack, Pickit, Pather, Town, Misc) {
				// Enforce the fact we have settings
				const config = typeof Config.SpeedBaal === 'object' && Config.SpeedBaal || {};
				if (!config.hasOwnProperty('Follower')) config.Follower = false;
				if (!config.hasOwnProperty('ShrineFinder')) config.ShrineFinder = false;
				if (!config.hasOwnProperty('ShrineTaker')) config.ShrineTaker = false;
				if (!config.hasOwnProperty('Leecher')) config.Leecher = undefined;
				if (!config.hasOwnProperty('Diablo')) config.Diablo = {};

				const Precast = require('Precast');
				const TownPrecast = require('TownPrecast');
				const GameData = require('GameData');
				const PreAttack = require('PreAttack');
				const Event = new require('Events');
				const Team = require('Team');

				// Data we get from the thread
				const data = {baalTick: 0, diaReady: false,};
				const teamData = {safe: false, shrineUp: false};
				const shrineAreas = [];

				Messaging.on('SpeedBaal', obj => Object.keys(obj).forEach(key => {
					print(key+' -> '+obj[key]);
					data[key] = obj[key]
				}));
				Delta.track(() => data.baalTick, () => print('Baal laughed'));
				Delta.track(() => diaReady, () => diaReady && print('Diablo ready'));
				Delta.track(() => data.baalTick, () => this.nextWave === 1 && Team.broadcastInGame({SpeedBaal: {safe: true}}));

				if (config.ShrineTaker && !config.ShrineFinder) {
					Delta.track(() => teamData.shrineUp, (o,n) => {
						print('TAKING A SHRINE? -> '+n);
						n && shrine.take(n)
					});
				}


				Team.on('SpeedBaal', data => Object.keys(data).forEach(key => teamData[key] = data[key]));
				Team.on('SpeedBaalShrineAreas', data => shrineAreas.push(data)); // Store which areas are being searched for a shrine

				const tyrealAct5 = function () {
					Town.goToTown(4);
					// in case we are in act 4.
					Town.move("tyrael");
					if (getUnit(2, sdk.units.RedPortalToAct5)) { // a red portal present?
						Pather.useUnit(2, sdk.units.RedPortalToAct5, sdk.areas.Harrogath);
					} else {
						let tyrael = getUnit(1, "tyrael");

						if (!tyrael || !tyrael.openMenu()) {
							Town.goToTown(5); // Looks like we failed, lets go to act 5 by wp
						} else {
							Misc.useMenu(0x58D2); // Travel to Harrogath
						}
					}
				}
				/**
				 * @param x
				 * @param y
				 * @constructor
				 */
				const Spot = function (x, y) {
						this.x = x;
						this.y = y;

						this.clear = () => this.moveTo() && self.clear();
						Object.defineProperty(this, 'distance', {
							get: function () {
								return getDistance.apply(null, [me, x, y]);
							}
						});
					},
					self = this,
					spots = {
						throne: {
							tp: new Spot(15083, 5035),
							baal: new Spot(15089, 5011),
							chamberPortal: new Spot(15089, 5006),
							center: new Spot(15094, 5029),
						},
						worldstone: {
							fastMove: new Spot(15144, 5892),
							baalSpot: new Spot(15134, 5923)
						}
					};

				const toThrone = function () {
					Town();
					Config.FieldID && Town.fieldID();

					// 2 ways to go to throne, either travel our self, or take an portal.
					if (!config.Follower) {
						let path = [[15112, 5206], [15111, 5175], [15112, 5141], [15109, 5107], [15113, 5073], [15083, 5035]];
						TownPrecast();
						// go to the throne
						Pather.journeyTo(sdk.areas.ThroneOfDestruction);

						// A predefined path is quicker as always calculating the path over and over again, this is the fastest route in throne ;)
						path.forEach(args => Pather.moveTo.apply(Pather, args));

						//ToDo; check if alone in game, if so, dont create a portal. Or, dont recast one if its up already
						Pather.makePortal();

						return me.area === sdk.areas.ThroneOfDestruction;
					}

					// Precast in town, or go bo outside of town and return to act 4, If we need to precast =)
					if (!(TownPrecast.can && TownPrecast()) && Precast.skills.length) {
						Precast.outTown();
						Pather.useWaypoint(sdk.areas.PandemoniumFortress);
					}

					// In case we in aren't in act < 4, go to act 4
					me.area < sdk.areas.PandemoniumFortress && Town.goToTown(4); // Go to act 4.

					if (me.area === sdk.areas.PandemoniumFortress) {
						tyrealAct5();
					}

					// If still not in town act 5, go to it and move to portal spot
					Town.goToTown(5) && Town.move("portalspot");

					// Wait for the portal
					for (let i = 0, delayI = 10; i < 30 * (1000 / delayI); i += 1) {
						if (config.Leecher && teamData.safe && Pather.usePortal(sdk.areas.ThroneOfDestruction, null)) break;
						if (!config.Leecher && Pather.usePortal(sdk.areas.ThroneOfDestruction, null)) break;

						delay(delayI);
					}

					return me.area === sdk.areas.ThroneOfDestruction;
				};

				this.wave = 0;
				this.nextWave = 1;
				this.safe = false;

				this.checkThrone = function () {
					let waveMonsters = [23, 62, 105, 381, 557, 558, 571], waves = [1, 1, 2, 2, 3, 4, 5],
						monster = getUnits(1)
							.filter(monster => monster.attackable && waveMonsters.indexOf(monster.classid) > -1)
							.first();

					return monster ? waves[waveMonsters.indexOf(monster.classid)] : 0;
				};

				const waves = function () {
					do {
						self.wave = self.checkThrone();
						self.wave && (self.nextWave = self.wave + 1);

						if (!self.wave) {
							self.clear(); // First clear the throne
							PreAttack.do([0, 23, 105, 557, 558, 571][self.nextWave], 12e3 - (getTickCount() - data.baalTick), spots.throne.center);
						} else {

							print('wave:' + self.wave);
							// In a wave
							self.clear(); // First clear the throne
							self.afterWave();
						}

						delay(10);

						// In case we moved to far from the throne's center
						[15091, 5013].distance > 40 && !getUnit(1, sdk.units.BaalSitting) && [15092, 5041].moveTo();

						if (!getUnit(1, sdk.units.BaalSitting)) break;
					} while (self.wave !== 5 || self.checkThrone());

					return true;
				};

				this.afterWave = function (wave) {
					if (typeof Config.BossTraps !== 'undefined' && Array.isArray(Config.BossTraps) && Config.BossTraps.length) {
						Config.UseFade && me.cast(258); // cast bos

						Config.BossTraps.forEach((type, index) => me.cast(type, undefined, spots.throne.center.x - (Config.BossTraps.length / 2) + index, spots.throne.center.y - 10));

						Config.UseFade && me.cast(267); // cast fade
					}

					if (this.wave === 3) {
						let hydra = getUnit(1, getLocaleString(3325));
						!hydra && print('No hydra! <3');

					}
				};

				this.clear = function (wave) {
					const getUnits_filted = () => getUnits(1, -1)
						.filter(unit => unit.hp > 0 && unit.attackable && spots.throne.center.distance < 40 && !checkCollision(me, unit, 0x0))
						.filter(
							unit => unit.x > 15070 && unit.x < 15120 // Between the x coords
								&& unit.y > 5000 && unit.y < 5075 // And between the y coords
						)
						.sort((a, b) => GameData.monsterEffort(a, a.area).effort - GameData.monsterEffort(b, b.area).effort - ((b.distance - a.distance) / 5));

					let units = getUnits_filted(), unit;
					if (units) for (; (units = getUnits_filted()) && units.length;) {
						delay(20);
						if (!(unit = units.first())) break; // shouldn't happen but to be sure
						for (let done = false; !done && unit.attackable;) {
							done = !unit.attack();
						}
					}
					return true;
				};

				const killBaal = function () {
					if ([sdk.areas.WorldstoneChamber, sdk.areas.ThroneOfDestruction].indexOf(me.area) === -1) {
						// ToDo; magic to go to throne/WorldstoneChamber
					}
					Config.FieldID && Town.fieldID(); // perfect moment to have an empty inventory
					if (me.area === sdk.areas.ThroneOfDestruction) {
						// Go to WorldstoneChamber
						Pather.moveTo(15089, 5006);
						const baalSitting = !!getUnit(1, 543);

						while (getUnit(1, 543) && delay(3)) ;

						baalSitting && delay(1000); // Only a bit if baal wasnt there in the first place
						me.area !== sdk.areas.WorldstoneChamber && Pather.usePortal(null, null, getUnit(2, 563));
					}

					if (me.area !== sdk.areas.WorldstoneChamber) {
						throw Error('failed to go to the worldstone chamber');
					}

					switch (build.me) {
						case build.warcry:
						case build.convict:
							clickParty(getParty(), 3); // leave party
							break;
						case build.curser:
							let unit = getUnit(1, 544);
							if (unit) {
								print('cast lower curse on distance on baal');
								me.cast(91, 0, 15166, 5903);
							}
							break;
					}
					// If we can teleport, move quickly over gap.
					me.getSkill(43, 1) && spots.worldstone.fastMove.moveTo();
					spots.worldstone.baalSpot.moveTo();
					Attack.kill(544); // Baal
					Pickit.pickItems();
					delay(rand(1000, 2000));
					return true;
				};

				const shrine = {
					find: function () {
						// First randomly go bo
						Precast.outTown(); // This also gives a bit of time for all the chars to be in game (to avoid issues with starting at the same area of boing)
						//Pather.useWaypoint(sdk.areas.RogueEncampment); // go to act after doing

						// only area's with this wp
						let searchAreas = [sdk.areas.ColdPlains, sdk.areas.StonyField, sdk.areas.DarkWood, sdk.areas.BlackMarsh, sdk.areas.JailLvl1, sdk.areas.CatacombsLvl2].shuffle();
						const [success, area] = [searchAreas.some(area => {
							if (teamData.shrineUp) return false; // shrine already found by an bot
							Pather.getWP(me.area,false,true);
							Pather.useWaypoint(area);
							// let the rest know where im searching
							Team.broadcastInGame({SpeedBaalShrineAreas: {area: area,}});
							return Misc.getShrinesInArea(area, 15, config.ShrineTaker/*If we take the shrine, we just take it*/);
						}), me.area];
						print('Succesfully found a shrine? --> '+success+','+!teamData.shrineUp+','+!config.ShrineTaker);
						if (success && !teamData.shrineUp && !config.ShrineTaker) {
							print('Tell team we found the magical shrine');
							Team.broadcastInGame({SpeedBaal: {shrineUp: area}});
						}
						Pather.makePortal();
						Pather.getWP(me.area,false,true);
						Pather.useWaypoint(sdk.areas.PandemoniumFortress);
						tyrealAct5();
					},

					take: function (area) {
						const [preArea,inTown,preTown] = [area,me.inTown,sdk.areas.townOf(me.area)];

						print('here');
						//ToDo; do not get it during a wave;
						Town.goToTown(sdk.areas.townOf(area));
						Town.move('portalspot');
						Pather.usePortal(area,null);
						let shrine = getUnits(2, "shrine").filter(shrine => shrine.mode === 0 && shrine.distance <= 20 && shrine.objtype === sdk.shrines.Experience).first();
						shrine && Misc.getShrine(shrine);


						Pather.getWP(me.area); // move to waypoint (as portal delay takes long)
						Pather.useWaypoint(sdk.areas.PandemoniumFortress); // move to act 4.

						//ToDo; if diaReady pwn dia.
						preTown === 5 && tyrealAct5(); // use tyreal to go to act 5
						// If i wasnt in town, go to previous area
						!inTown && Town.move('portalspot') && Pather.usePortal(preArea);
					},
				};
				const build = new function () {
					this.me = 0;
					this.warcry = 1;
					this.javazon = 2;
					this.hammerdin = 3;
					this.blizzard = 4;
					this.convict = 5;
					this.curser = 6;
					this.firesorc = 7;
					this.lightsorc = 8;
					(() => {
						const mostUsedSk = GameData.mostUsedSkills().filter(x => x.used > 10).map(x => x.skillId);
						switch (true) {
							case me.classid === sdk.charclass.Barbarian:
								return (this.me = this.warcry);

							case me.classid === sdk.charclass.Necromancer:
								return (this.me = this.curser);

							// If we have more as 5 hard points in conviction, pretty sure that is our goal
							case me.getSkill(sdk.skills.Conviction, 0) > 5:
								return (this.me = this.convict);

							case [sdk.skills.BlessedHammer, sdk.skills.HolyBolt].some(sk => mostUsedSk.indexOf(sk) !== -1):
								return (this.me = this.hammerdin);

							case [sdk.skills.Meteor, sdk.skills.FireBall].some(sk => mostUsedSk.indexOf(sk) !== -1):
								return (this.me = this.firesorc);

							case [sdk.skills.Blizzard, sdk.skills.FrozenOrb, sdk.skills.IceBolt].some(sk => mostUsedSk.indexOf(sk) !== -1):
								return (this.me = this.blizzard);

							case [sdk.skills.ChargedStrike, sdk.skills.LightningFury, sdk.skills.LightningStrike].some(sk => mostUsedSk.indexOf(sk) !== -1):
								return (this.me = this.javazon);

							case [sdk.skills.Lightning, sdk.skills.ChainLightning].some(sk => mostUsedSk.indexOf(sk) !== -1):
								return (this.me = this.lightsorc);
						}
						return null;
					})();
				};
				if (config.ShrineFinder) shrine.find();
				[toThrone, waves, killBaal].some(item => !item());
			};
			module.exports = function (...args) {
				try {
					SpeedBaal.apply(this, args)
				} finally {
					Delta.destroy();
				}
			}
	}
}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);
