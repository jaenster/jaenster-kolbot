/** @typedef {function(Config, Attack, Pickit, Pather, Town, Misc): number} BotSignature */

/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {

	const AreaData = require('../../modules/AreaData');
	const Precast = require('../../modules/Precast');

	/** @template T - any object
	 * @template K - key of T
	 * @type {function(T, K, function(function&T[K], typeof T[K])): number}  */
	function whatever() {
	};

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
		this.original = Obj[name];
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

			// If we can teleport we just use the original Pather.journeyTo
			const useTeleport = this.useTeleport();

			let [to] = args;
			console.debug('My journey to ' + AreaData[to].LocaleString);

			if (to === me.area) return me.area === to;

			// If we walk however, we might want to do something else with the journey to
			const target = this.plotCourse(to, me.area);

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
						case me.gold < Town.LowGold / 2: // very low on gold
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
							quit();
							break;
						}
					}

				}

				// now we know sure we are either in town, or near a waypoint
			}


			while (target.course.length) {
				let ps;

				const whereTo = target.course.first();

				// If we dont have the actual wp, go get it. ToDo; overwrite the getWP code to be more flexible for walkers too
				if (this.wpAreas.indexOf(me.area) > -1 && !getWaypoint(this.wpAreas.indexOf(me.area))) {
					this.getWP(me.area);
				}

				!me.inTown && Precast();
				switch (true) {
					// use waypoint if that is the next step
					case this.wpAreas.indexOf(whereTo) > -1 && getWaypoint(this.wpAreas.indexOf(whereTo)): {
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

					case (me.area === 111 && target.course[0] === 125): { // Abaddon
						ps = getPresetUnit(111, 2, 60).realCoords();
						walkTo(ps);
						this.usePortal(125);

						break;
					}
					case (me.area === 112 && target.course[0] === 126): { // Pits of Archeon
						ps = getPresetUnit(112, 2, 60).realCoords();
						walkTo(ps);
						this.usePortal(126);

						break;
					}
					case (me.area === 117 && target.course[0] === 127): { // Infernal Pit
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

						// move to the exit
						walkTo(exit);

						// use the exit
						Pather.moveToExit(whereTo, true);
						break;
					}
				}

				target.course.shift();
			}
		});

		new Overload(Pather, 'useTeleport', /**@this Pather*/ function useTeleport(original, ...args) {
			const Skills = require('../../modules/Skills');
			// Idea is to not use teleport if we dont have enough mana on lower levels.
			return this.teleport && (me.level >= 30 || (me.mp - Skills.manaCost[sdk.skills.Teleport] >= me.mpmax / 2)) && !me.getState(sdk.states.Wolf) && !me.getState(sdk.states.Bear) && !me.inTown && ((me.classid === 1 && me.getSkill(sdk.skills.Teleport, 1)) || me.getStat(sdk.stats.Nonclassskill, sdk.skills.Teleport));
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