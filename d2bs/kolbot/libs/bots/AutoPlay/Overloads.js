/** @typedef {function(Config, Attack, Pickit, Pather, Town, Misc): number} BotSignature */

/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {

	const AreaData = require('../../modules/AreaData');
	const Precast = require('../../modules/Precast');

	/**
	 * @template T {Object}
	 * @template K {keyof T}
	 * @param {T} Obj
	 * @param {K} name
	 * @param {(T[K], infer T[K])}fn
	 * @constructor
	 */
	function Overload(Obj, name, fn) {
		this.obj = Obj;
		this.name = name;
		this.original = typeof Obj[name] === 'function' && Obj[name] || undefined;
		this.fn = fn;
		this.installed = false;

		Overload.instances.push(this);
	}

	// static variable
	Overload.instances = [];

	Overload.prototype.remove = function () {
		if (this.installed) {
			console.debug('removing ' + this.obj.name + '.' + this.name);
			this.obj[this.name] = this.original;

			this.installed = false;
		}
	};

	Overload.prototype.install = function () {
		if (!this.installed) {
			console.debug('Overloading ' + this.obj.name + '.' + this.name);
			this.obj[this.name] = this.fn.bind(this.obj, this.original);

			this.installed = true;
		}
	};

	/**
	 *
	 * @param {Config} Config
	 * @param {Attack} Attack
	 * @param {Pickit} Pickit
	 * @param {Pather} Pather
	 * @param {Town} Town
	 * @param {Misc} Misc
	 * @returns {{rollback: rollback}}
	 */
	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
		const from = Overload.instances.length;

		new Overload(Pather, 'journeyTo', /**@this Pather*/ function journeyTo(original, ...args) {
			// return original.apply(Pather, args);
			const walkTo = require('./modules/WalkTo');

			let [to] = args;
			console.debug('My journey to ' + AreaData[to].LocaleString);

			if (to === me.area) return me.area === to;

			// If we walk however, we might want to do something else with the journey to
			const target = this.plotCourse(to, me.area);

			// Add GreatMarsh if needed
			if (target.course.indexOf(sdk.areas.FlayerJungle) > -1) {
				if (me.act !== 3) {
					Town.goToTown(3);
				}

				let special = getArea(sdk.areas.FlayerJungle);
				if (special) {
					special = special.exits;

					for (let i = 0; i < special.length; i += 1) {
						if (special[i].target === sdk.areas.GreatMarsh) {
							target.course.splice(target.course.indexOf(sdk.areas.FlayerJungle), 0, sdk.areas.GreatMarsh); // add great marsh if needed

							break;
						}
					}
				}
			}
			console.debug(' -- Path to take -- ' + target.course.map(el => AreaData[el].LocaleString).join(' -> '));

			// in the odd case we are in the field, check if we can take a local waypoint
			if (target.useWP) {

				if (!me.inTown) {
					console.debug('Lets see if we can avoid a TP');
					// Get town distances

					// get local copies
					const area = AreaData[me.area];
					const townArea = area.townArea();

					// location we come @ taking waypoint
					Town.initialize();
					const [tpx, tpy] = Town.ActData[me.act - 1].spot.portalspot;

					// location we want to walk to after tp
					const [wpx, wpy] = Town.ActData[me.act - 1].spot.waypoint;

					// calculate distance between tp -> wp
					const townDistance = Pather.getWalkDistance(wpx, wpy, townArea.Index, tpx, tpy);

					// get real world distance

					// where is the nearst waypoint
					let preset = area.waypointPreset().realCoords();

					//ToDo; calculate teleport distance, as teleporting can is quicker as walking.
					// So, i rather teleport a distance of 100, as i walk a distance of 20
					const realWorldDistance = Pather.getWalkDistanceLongDistance(me, preset);

					// Do we want to use the nearst waypoint, or do we want to walk?
					// If the town distance is just twice the local distance, or if realWorldDistance is just low

					let tpBook = me.findItem("tbk", 0, 3);
					let tpScroll = me.findItem("tsc", 0, 3);

					console.debug('Walking to wp takes us: ', Math.round(realWorldDistance));
					switch (true) {

						// If its very far away, take tpScroll to go to town
						case tpScroll && !tpBook && realWorldDistance > 300: {
							tpScroll.interact();
							let portal = Misc.poll(() => (portal => portal && portal.getParent() === me.name && portal.distance < 20)(getUnit(2, "portal")));

							portal && Pather.usePortal(null, null, portal);
							break;
						}

						case !tpBook && realWorldDistance > 300: {
							console.debug('We have to walk that far, i rather give up');
							quit();
							break;
						}

						case realWorldDistance < townDistance * 2: // waypoint is nearby
						case realWorldDistance < 40: // waypoint is relatively close
						case me.gold < Config.LowGold / 2: // very low on gold
						case !tpBook: // If no book
						{

							// We might need to walk trough allot of stuff, but the system tells us its worth it

							console.debug('Walk towards waypoint -- ', realWorldDistance, " -- ", preset);


							//ToDo; Imagen we are currently in Underground Passage level 2
							// We want to go to Dark Woods but we dont have WP
							// We get send to Stony Field.
							// We walk to
							// 1) Underground Passage level 1 -> // so far so good
							// 2) Stony Field ->
							// 3) wp ->
							// 4) use waypoint to Stonyfield -> // we already here
							// 5) Underground Pasage Level 1 ->
							// 6) Dark Woods
							// ^
							// We can skip step 2 to 5, no need to recursively walk trough the same areas
							// Figure out to cut out the middle steps

							// calculate a journey from preset to me, and then reverse it. So the system dont simply says to take a wp..
							const journeys = Pather.getLongDistancePath(me, preset, true);
							console.debug(journeys);

							// Go to area of Waypoint
							if (me.area !== preset.area) {
								// recursive call
								journeys.forEach((to, i, s) => {
									console.debug('backtracking via ', AreaData[to.area].LocaleString, ' ---- ', to);

									const target = {x: to.tox, y: to.toy,};
									target.distance > 5 && walkTo(target);

									console.debug('is last? ', i !== s.length - 1, ' - ', i, ' - ', s.length);
									if (i !== s.length - 1) {
										console.debug('Use exit -- ', AreaData[s[i + 1].area].LocaleString);
										Pather.moveToExit(s[i + 1].area, true);
									}
								});
							}

							// walk to preset
							walkTo(preset);

							break;
						}

						default: {
							// we already tried using a scroll
							if (!tpBook) quit();

							console.debug('Fuck this shit, not gonna walk that far');
							Pather.makePortal(true);
							break;
						}
					}

				}

				// now we know sure we are either in town, or near a waypoint
			}


			while (target.course.length) {
				let ps;

				let whereTo = target.course.first();
				// we are already here ;)
				if (whereTo === me.area) {
					console.debug('next');
					target.course.shift();
					continue;
				}

				// If we dont have the actual wp, go get it. ToDo; overwrite the getWP code to be more flexible for walkers too
				if (this.wpAreas.indexOf(me.area) > -1 && !getWaypoint(this.wpAreas.indexOf(me.area))) {
					this.getWP(me.area);
				}

				!me.inTown && Precast();
				switch (true) {
					// use waypoint if that is the next step
					case target.useWP && this.wpAreas.indexOf(me.area) > -1 && this.wpAreas.indexOf(whereTo) > -1 && getWaypoint(this.wpAreas.indexOf(whereTo)): {
						this.useWaypoint(whereTo, !this.plotCourse_openedWpMenu);
						Precast();
						break;
					}

					// open and use the gate
					case me.area === sdk.areas.Harrogath && whereTo === sdk.areas.BloodyFoothills: {
						this.moveTo(5026, 5095);
						let unit = getUnit(2, 449); // Gate

						Misc.poll(() => unit.mode || Misc.click(0, 0, unit));
						this.moveToExit(whereTo, true);

						break;
					}

					// stony field -> tristham
					case me.area === sdk.areas.StonyField && whereTo === sdk.areas.Tristram: {
						ps = getPresetUnit(me.area, 1, 737).realCoords();

						const path = getPath(ps.area, ps.x, ps.y, me.x, me.y, 0, 25);
						path.shift(); // remove node @ portal

						// get second to last node, as we shifted the first one
						const node = path.first();

						// safely walk to this node
						walkTo(node);

						Misc.poll(() => me.area === sdk.areas.Tristram || this.usePortal(sdk.areas.Tristram));

						break;
					}

					// Lut Gholein -> Sewers Level 1 (use Trapdoor)
					case sdk.areas.LutGholein === me.area && whereTo === sdk.areas.A2SewersLvl1: {

						// Just use the move to preset stuff, as we dont need to clear in town
						this.moveToPreset(me.area, 5, 19);
						this.useUnit(2, sdk.units.TrapDoorA2, sdk.areas.A2SewersLvl1);
						break;
					}

					// Arcane Sanctuary -> Canyon
					case me.area === sdk.areas.ArcaneSanctuary && whereTo === sdk.areas.CanyonOfMagi: {
						ps = getPresetUnit(me.area, 2, sdk.units.Journal).realCoords();

						walkTo(ps);


						Misc.poll(() => {
							const journal = getUnit(2, sdk.units.Journal);
							if (journal) if (me.getSkill(sdk.skills.Telekinesis, 1)) {
								journal.cast(sdk.skills.Telekinesis);
							} else {
								journal.click();
							}
							me.cancel();
							return journal.mode;
						});
						this.usePortal(sdk.areas.CanyonOfMagi);
						break;
					}

					// palace -> arcance
					case me.area === sdk.areas.PalaceCellarLvl3 && whereTo === sdk.areas.ArcaneSanctuary: {
						walkTo({x: 10073, y: 8670});
						this.usePortal(null);

						break;
					}

					// anya -> nihla
					case me.area === sdk.areas.Harrogath && whereTo === sdk.areas.NihlathaksTemple: {
						Town.move(NPC.Anya);
						this.usePortal(sdk.areas.NihlathaksTemple);

						break;
					}
					// Abaddon
					case (me.area === 111 && target.course[0] === 125): {
						ps = getPresetUnit(111, 2, 60).realCoords();
						walkTo(ps);
						this.usePortal(125);

						break;
					}
					// Pits of Archeon
					case (me.area === 112 && target.course[0] === 126): {
						ps = getPresetUnit(112, 2, 60).realCoords();
						walkTo(ps);
						this.usePortal(126);

						break;
					}
					// Infernal Pit
					case (me.area === 117 && target.course[0] === 127): {
						ps = getPresetUnit(117, 2, 60).realCoords();
						walkTo(ps);
						this.usePortal(127);

						break;
					}

					default: {

						const areaObj = getArea();

						const exit = areaObj.exits.find(el => el.target === whereTo);

						console.debug('--------------');
						console.debug(AreaData[whereTo].LocaleString + ' -- exit is searched in ' + AreaData[me.area].LocaleString);
						console.debug('--------------');
						if (!exit) break;
						let dest = this.getNearestWalkable(exit.x, exit.y, 5, 1);

						// move to the exit
						walkTo({x: dest[0], y: dest[1],});

						// use the exit
						Pather.moveToExit(whereTo, true);
						break;
					}
				}

				target.course.shift();
			}

			return me.area === to;
		});

		const Skills = require('../../modules/Skills');

		new Overload(Pather, 'useTeleport', /**@this Pather*/ function useTeleport(original, ...args) {

			const canTeleport = this.canTeleport();
			if (!canTeleport) return false;

			return me.charlvl >= 30 || (me.mp - Skills.manaCost[sdk.skills.Teleport] >= me.mpmax / 3 || me.getState(sdk.states.Manapot));
		});


		// Smart use of telekenis, as telekenis is epic but expensive
		new Overload(Pickit, 'useTk', /** @this Pickit*/ function (original, unit, itemStat) {

			// If we are not a sorc and dont have the skills and such, yeah we cant do a thing
			const weCan = original.call(original, unit, itemStat);

			// if we cant use tk, no sense to figure out the rest
			if (!weCan) return weCan;

			// Only use telekenis if it cost us less as 6,66% (1/15th) of our total mana
			// And if we have have enough mana to teleport twice, given we have the teleport skill
			return Skills.manaCost[sdk.skills.Telekinesis] >= me.mpmax / 15
				&& (!me.getSkill(sdk.skills.Teleport, 1) || Skills.manaCost[sdk.skills.Teleport] * 2 <= me.mp);

		});

		// Walk safely to the wp
		new Overload(Pather, 'getWP', /** @this Pather */ function (original, area, clearPath, click = true) {
			// If no area given, go to this one
			if (!area) area = me.area;

			// We gonna assume the journeyTo is correct and good
			if (area !== me.area) Pather.journeyTo(area);

			const preset = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539].reduce((acc, cur) => acc || getPresetUnit(area, 2, cur), undefined);
			if (!preset) throw new Error('Waypoint not found');

			console.debug(preset);
			const coords = preset.realCoords();
			const walkTo = require('./modules/WalkTo');

			walkTo(coords);

			const wp = getUnit(2, "waypoint");
			if (!wp) return false;
			if (!click) return true;

			return Misc.poll(() => {
				let wp = getUnit(2, "waypoint");
				wp.moveTo();
				if (wp && wp.mode !== 2) {
					return Misc.poll(() => {
						wp.click();
						return getUIFlag(sdk.uiflags.Waypoint);
					}, 6000, 30);
				}
				return false;
			});

		});

		// Sort the inventory after buying pots
		new Overload(Town, 'identify', /** @this Pather*/ function (original, ...args) {

			const bought = original.apply(this, args);
			if (bought) require('../../modules/Storage').Inventory.SortItems();
			return bought;

		});

		// We always want a merc, but we cant always get a merc
		new Overload(Town, 'needMerc', /** @this Town*/ function (original, ...args) {

			// ToDo; fix stuff for classic
			if (me.gametype === 0 || me.gold < me.mercrevivecost) { // gametype 0 = classic
				return false;
			}
			//ToDo; hire a merc if access to act 2 and we have a act 1 merc

			// If merc costs arent zero, we got one
			let gotMerc = me.mercrevivecost !== 0;
			if (gotMerc) return 'revive';

			const merc = Misc.poll(() => me.getMerc(), 3000, 30);

			let aliveMerc = merc && merc.mode !== 0 && merc.mode !== 12;
			if (aliveMerc) return false; // merc is alive

			// We have a merc, so yes we revive it
			let accessToMerc = gotMerc || AreaData[sdk.areas.LutGholein].canAccess() || me.getQuest(sdk.quests.SistersBurialGrounds, 0);
			if (!accessToMerc) return false; //no access to hire a merc, so we cant

			// now we know we dont have an alive merc, or a revivable merc
			return 'hire';
		});

		new Overload(Town, 'hireMerc', /** @this Town*/ function (original) {
			const Merc = require('./modules/Merc');

			let actMerc = [1, 2][AreaData[sdk.areas.LutGholein].canAccess() & 1];

			// this is safe as addEventListener for copydata isnt done in default.dbj anymore
			try {
				Town.goToTown(actMerc);

				// Start listening from here, as act switching messes up packethandeling
				addEventListener("gamepacket", Merc.packetHandler);

				Town.initNPC("Merc", "hireMerc");
				delay(5000); //ToDo; poll merc list

				// find the best merc to hire
				const bestMerc = Merc.instances.reduce((winner, cur) => {
					if (actMerc === 2) { // has a def skill?
						let defSkill = cur.skills.find(skill => skill.name === "Defiance");
						if (!defSkill) return winner;
					}

					// if we have no winner yet, this one is better, assuming we can afford it
					if (!winner && cur.cost <= me.gold) return cur;

					// is this one of higher level?
					if (winner && winner.level < cur.level) return cur;

					return winner;
				}, undefined);

				// Found a merc we can afford/want?
				if (bestMerc) {
					console.debug('Hiring merc ', bestMerc);
					bestMerc.hire();
				}

			} finally { // i dont care for errors but clean up the gamepacket handler
				removeEventListener('gamepacket', Merc.packetHandler);
			}
		});

		// small hijack, to support the hire of a merc on requirement
		new Overload(Town, 'reviveMerc', /** @this Town*/ function (original, ...args) {

			const needed = this.needMerc();
			console.debug(needed);

			switch (needed) {
				case false: // no such merc
					return true;
				case 'hire':
					return this.hireMerc();
			}

			return original.apply(this, args);

		});

		new Overload(Town, 'getPotion', /** @this Town */ function (original, npc, type, highestPot=5) {

			let result;

			if (!type || typeof type !== 'string') return false;

			if (type === "hp" || type === "mp") {
				for (let i = highestPot; i > 0; i -= 1) {
					let result = npc.getItem(type + i);

					if (result) return result;
				}
			} else if (type === "yps" || type === "vps" || type === "wms") {
				for (let i = highestPot; i > 0; i -= 1) {
					result = npc.getItem(type);

					if (result) return result;
				}
			}

			return false;

		});

		new Overload(Town, 'buyPotions', /** @this Town */ function (original) {

			if (me.gold < 1000) return false;

			const Storage = require('../../modules/Storage');
			let beltSize = Storage.BeltSize(), col = Town.checkColumns(beltSize);

			// Check if we want buffer'd items
			const buffer = {hp: 0, mp: 0,};

			// count the buffer pots in the inventory
			(me.getItems() || [])
				.filter(pot => pot.location === sdk.storage.Inventory && [76/*hp*/, 77/*mp*/].includes(pot.itemType))
				.forEach(pot => buffer[['hp', 'mp'][pot.itemType - 76]]++);

			let needPots;
			// Check the MinConfig range
			for (let i = 0; i < 4; i += 1) needPots = needPots || (["hp", "mp"].includes(Config.BeltColumn[i]) && col[i] > (beltSize - Math.min(Config.MinColumn[i], beltSize)));

			let needBuffer = true;

			// Check if we need any potions for buffers
			if (buffer.mp < Config.MPBuffer || buffer.hp < Config.HPBuffer) {
				for (let i = 0; i < 4; i += 1) {
					// We can't buy potions because they would go into belt instead
					if (col[i] >= beltSize && (!needPots || Config.BeltColumn[i] === "rv")) {
						needBuffer = false;
						break;
					}
				}
			}

			// We have enough potions in inventory
			if (buffer.mp >= Config.MPBuffer && buffer.hp >= Config.HPBuffer) {
				needBuffer = false;
			}

			// No columns to fill
			if (!needPots && !needBuffer) return true;


			// Actually buy the pots
			const PotionData = require('../../modules/PotionData');

			// Just get the pots effects
			const mpPotsEffects = PotionData.getMpPots().map(el => el.effect[me.classid]);
			const hpPotsEffects = PotionData.getHpPots().map(el => el.effect[me.classid]);

			console.debug(mpPotsEffects);
			console.debug(hpPotsEffects);
			// find the pot that heals more as half, or just buy the best available
			let wantedHpPot = (hpPotsEffects.findIndex(eff => me.hpmax / 2 < eff) + 1 || hpPotsEffects.length - 1);
			let wantedMpPot = (mpPotsEffects.findIndex(eff => me.mpmax / 2 < eff) + 1 || mpPotsEffects.length-1);

			// buy pots in higher act in normal, as pots get better in each act
			if (me.diff === 0) {
				let wantToAccessAct = Math.max(wantedHpPot, wantedMpPot);
				console.debug(wantToAccessAct);

				// Calculate the cap on the pots we want
				if (me.act < wantToAccessAct) {
					// find highest act we can access
					while (wantToAccessAct && !Pather.accessToAct(wantToAccessAct)) wantToAccessAct--;
					console.debug(wantToAccessAct);

					if (Pather.accessToAct(wantToAccessAct)) {
						console.debug('Moving to act ' + wantToAccessAct);
						Town.goToTown(wantToAccessAct);
					}
				}
			}

			let npc = Town.initNPC("Shop", "buyPotions");
			if (!npc) return false;

			// Buy the belt's pots
			for (let i = 0; i < 4; i += 1) {
				if (col[i] > 0) {

					let highestPot = Config.BeltColumn[i] === 'hp' ? wantedHpPot : (Config.BeltColumn[i] === 'mp' ? wantedHpPot : 5);

					let useShift = Town.shiftCheck(col, beltSize),
						pot = Town.getPotion(npc, Config.BeltColumn[i], highestPot);

					if (pot) {
						//print("ÿc2column ÿc0" + i + "ÿc2 needs ÿc0" + col[i] + " ÿc2potions");

						// Shift+buy will trigger if there's no empty columns or if only the current column is empty
						if (useShift) {
							pot.buy(true);
						} else {
							for (let j = 0; j < col[i]; j += 1) {
								pot.buy(false);
							}
						}
					}
				}

				col = Town.checkColumns(beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
			}


			if (needBuffer && buffer.hp < Config.HPBuffer) {
				for (let i = 0; i < Config.HPBuffer - buffer.hp; i += 1) {
					let pot = Town.getPotion(npc, "hp", wantedHpPot);

					if (Storage.Inventory.CanFit(pot)) {
						pot.buy(false);
					}
				}
			}

			if (needBuffer && buffer.mp < Config.MPBuffer) {
				for (let i = 0; i < Config.MPBuffer - buffer.mp; i += 1) {
					let pot = Town.getPotion(npc, "mp", wantedMpPot);

					if (Storage.Inventory.CanFit(pot)) {
						pot.buy(false);
					}
				}
			}

			return true;
		});


		Overload.instances.slice(from).forEach(ol => ol.install());
		return {
			rollback: () => {
				Overload.instances.forEach(el => el.remove());
			}
		}
	};

	module.exports.Overload = Overload;

})(module, require);