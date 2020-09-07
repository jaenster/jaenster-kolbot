(function (module, require) {


	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {


		let vizLayout, seisLayout, infLayout;


		Pather.journeyTo(sdk.areas.ChaosSanctuary, true); // load this area up


		const getLayout = function (seal, value) {
			const sealPreset = getPresetUnit(108, 2, seal);
			if (!seal || !sealPreset) throw new Error("Seal preset not found");
			return (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) ? 0 : 1
		};
		vizLayout = getLayout(396, 5275);
		seisLayout = getLayout(394, 7773);
		infLayout = getLayout(392, 7893);

		print('infLayout:' + infLayout);
		print('seisLayout:' + seisLayout);
		print('vizLayout:' + vizLayout);

		// make sure we have a safe spot to stand

		const tkOpenSeals = (seals) => {
			seals = seals.map(seal => getUnit(2, seal));

			do {
				seals = seals.filter(unit => unit && !unit.mode);
				seals.forEach(seal => {
					// get in position if needed
					print('Opening seal');
					seal.cast(sdk.skills.Telekinesis);
				});
			} while (seals.length)
		};

		const DodgeAttack = require('../modules/DodgeAttack');

		const clear = (settings) => {
			// clear the safe spots
			Object.keys(settings.spots).forEach(key => {
				const spot = settings.spots[key];
				print(spot.x + ',' + spot.y);
				spot.moveTo();
				me.securePosition(20, 0x07, 500);
			});

			// Open the seals
			settings.seals.forEach((sealId) => {
					// its the last seal in the list, so precast blizzard

					if (settings.precastingSpot.hasOwnProperty(sealId)) {
						settings.precastingSpot[sealId].moveTo();
						me.cast(sdk.skills.FireBall, 0, settings.spawnPoint.x, settings.spawnPoint.y)
					}

					print(settings.toSource());
					settings.openSealLocation[sealId].moveTo();
					let seal = getUnit(2, sealId);

					//ToDo; fail handeling
					seal.cast(sdk.skills.Telekinesis);
				}
			);

			// pwn the boss
			DodgeAttack({
				spots: settings.spots,
				monsterid: settings.boss,
				default: 'center', // key 0
				skill: sdk.skills.FireBall,
			});
		};

		print(infLayout);
		delay(100);
		const settings = {
			inf: {
				spots: [
					{ // inf = 0
						leftCornor: {x: 7941, y: 5301},
						rightCornor: {x: 7942, y: 5284},
						inactiveSealCornor: {x: 7921, y: 5266},
						nearCenter: {x: 7912, y: 5285},
						nearCenter2: {x: 7906, y: 5300},
						nextActiveSeal: {x: 7893, y: 5302},
						betweenSealsSafe: {x: 7893, y: 5288},
						inactiveSealCornorRight: {x: 7907, y: 5267},
						center: {x: 7898, y: 5297},
					}, { // inf = 1
						clearestCornor: {x: 7940, y: 5321},
						nextToActiveSeal: {x: 7909, y: 5305},
						2: {x: 7917, y: 5321},
						3: {x: 7934, y: 5303},
						4: {x: 7933, y: 5283},
						nextToSeal: {x: 7920, y: 5276},
						5: {x: 7906, y: 5281},
						6: {x: 7906, y: 5281},
						center: {x: 7908, y: 5305},
					}
				][infLayout],

				spawnPoint: [ // obv there is a difference between the layout where to wait
					{x: 7924, y: 5295}, // inf 0
					{x: 7921, y: 5275}, // inf 1
				][infLayout],

				waitForBoss: [ // obv there is a difference between the layout where to wait
					{x: 7921, y: 5266}, // position to wait for the boss
					{x: 7908, y: 5303},
				][infLayout],

				openSealLocation: [
					{
						393: {x: 7907, y: 5267}, // inactive
						392: {x: 7898, y: 5297}, // active one
					},
					{
						393: {x: 7917, y: 5281},
						392: {x: 7908, y: 5305}, // active one
					}
				][infLayout],

				precastingSpot: [
					{
						392: {x: 7898, y: 5297}, // Location to precast from
					},
					{
						392: {x: 7908, y: 5303},
					}
				][infLayout],

				boss: getLocaleString(2853),
				default: 'inactiveSealCornorRight',
				skill: sdk.skills.FireBall,
				seals: [393, 392]
			},

			seiz: {
				spots: [
					{
						base: {x: 7771, y: 5191},
						danger: {x: 7781, y: 5209},
						next: {x: 7795, y: 5222},
						heart: {x: 7767, y: 5224},
						aside: {x: 7787, y: 5193},
						center: {x: 7783, y: 5208},
					}, {
						closeToSealCornor: {x: 7821, y: 5147},
						safeToOpenSeal: {x: 7812, y: 5158},
						closeToSeal: {x: 7797, y: 5154},
						center: {x: 7782, y: 5154},
						close: {x: 7775, y: 5170},
						spawnpoint: {x: 7773, y: 5187},
						tobesure: {x: 7786, y: 5191},
					}
				][seisLayout],

				spawnPoint: [
					{
						394: {x: 7771, y: 5215},
					}, {
						394: {x: 7769, y: 5184},
					}
					//ToDo; other obv
				][seisLayout],

				waitForBoss: [
					{x: 7778, y: 5199},
					{x: 7782, y: 5154}
				][seisLayout],

				openSealLocation: [
					{
						394: {x: 7777, y: 5158}, // active only, there is only an active one
					},
					{
						394: {x: 7812, y: 5158},
					}
				][seisLayout],

				precastingSpot: [
					{
						394: {x: 7778, y: 5199}, // same as wait for boss
					}, {
						394: {x: 7782, y: 5154},
					}
				][seisLayout],

				boss: getLocaleString(2852),
				default: 'heart',
				skill: sdk.skills.FireBall,
				seals: [394],
			},

			viz: {
				spots: [
					{ // inf = 0
						conor: {x: 7648, y: 5267},
						next: {x: 7667, y: 5267},
						second: {x: 7673, y: 5282},

						1: {x: 7647, y: 5320},
						2: {x: 7647, y: 5306},
						0: {x: 7663, y: 5321},
						3: {x: 7675, y: 5310},
						4: {x: 7683, y: 5298},
						5: {x: 7688, y: 5292},
						tkLocInactive: {x: 7657, y: 5305},
						center: {x: 7667, y: 5277},
					}, { // inf = 1
						safeNextToSeal: {x: 7647, y: 5267},
						inactiveActivation: {x: 7658, y: 5278},
						betweenSeals: {x: 7654, y: 5294},
						activateActiveSeal: {x: 7652, y: 5312},
						center: {x: 7672, y: 5315},
						distanced: {x: 7686, y: 5314},
						semisafe: {x: 7664, y: 5303},
						waitSpot: {x: 7661, y: 5297},
					}
				][vizLayout],

				spawnPoint: [ // obv there is a difference between the layout where to wait
					{x: 7677, y: 5301},
					{x: 7684, y: 5315},
				][vizLayout],

				waitForBoss: [ // obv there is a difference between the layout where to wait
					{x: 7665, y: 5278},
					{x: 7657, y: 5306},
				][vizLayout],

				openSealLocation: [
					{
						395: {x: 7662, y: 5311},
						396: {x: 7663, y: 5283},
					},
					{
						395: {x: 7660, y: 5279},
						396: {x: 7657, y: 5306},
					}
				][vizLayout],

				precastingSpot: [
					{},
					{
						396: {x: 7657, y: 5306},
					}
				][vizLayout],

				boss: getLocaleString(2851),
				default: 'center',
				skill: sdk.skills.FireBall,
				seals: [395, 396]
			},
		};

		function doRun(who) {
			clear(settings[who]);
		}


		const Worker = require('../../../modules/Worker');

		function diablo() {
			let done = false, ___recusion = 0;
			print('pwn dia lol');
			const star = {x: 7792, y: 5292};

			let dst = 23;

			const safeSpots = {
				north: {x: star.x, y: star.y - dst},
				northeast: {x: star.x + 8, y: star.y - 20},
				east: {x: star.x + dst, y: star.y},
				southeast: {x: star.x + 20, y: star.y - 8},
				south: {x: star.x, y: star.y + dst},
				southwest: {x: star.x - 20, y: star.y + 8},
				west: {x: star.x - dst, y: star.y},
				northwest: {x: star.x + 20, y: star.y + 8},
			};

			const shouldDodge = (coord) => {
				return dia && getUnits(3)
					// for every missle that isnt from our merc
					.filter(missile => missile && dia && dia.gid === missile.owner)
					// if any
					.some(missile => {
						let xoff = Math.abs(coord.x - missile.targetx),
							yoff = Math.abs(coord.y - missile.targety),
							xdist = Math.abs(coord.x - missile.x),
							ydist = Math.abs(coord.y - missile.y);

						// If missile wants to hit is and is close to us
						return xoff < 7 && yoff < 7 && xdist < 13 && ydist < 13;
					});
			};

			let dia;
			const calcNewSpot = () => {
				let result = Object.keys(safeSpots)
					// Exclude a spot
					.filter(spot => getDistance(safeSpots[spot], dia || star) > 7)
					.filter(spot => getDistance(safeSpots[spot], dia || star) < 37)
					// Do not choose a spot i wanna dodge anyway
					.filter(spot => !shouldDodge(safeSpots[spot]))
					// Sort on least distance of diablo (or the star if he didnt spawned yet)
					.sort((a, b) => {
						print(a + ' - ' + getDistance(safeSpots[a], dia || star));
						print(b + ' - ' + getDistance(safeSpots[b], dia || star));
						return getDistance(safeSpots[a], dia || star) - getDistance(safeSpots[b], dia || star)
					});

				let best = 'north'; // default
				print(result.toSource());
				print(result.length);
				if (result.length > 1) {
					if (getDistance(safeSpots[result[0]], dia) > 10) {
						best = result[0]; // still on a safe distance
					} else {
						best = result[1];
					}
				} // second best is best
				if (result.length === 1) best = result[0]; // with a single option, chose the single option

				print(best);
				return best;
			};

			const merc = me.getMerc();
			Worker.runInBackground.diabloAvoid = function () {

				// Avoid double code runningz
				if (___recusion) return true; // keep on looping
				___recusion++;

				// If dia is there and dia is alive
				let dodge = dia && !dia.dead && shouldDodge(me/*depends on me*/);

				if (dodge) {
					print('DODGE');
					(spot = safeSpots[calcNewSpot()]).moveTo() // move to this new found spot
				}
				return ___recusion-- || !done;
			};
			let spot, line;
			do {
				let [x, y] = dia && [dia.x, dia.y] || [star.x, star.y];

				dia = getUnit(1, sdk.monsters.Diablo1);
				dia && (line = new Line(me.x, me.y, dia.x, dia.y, 0x84, true));

				// Get the second closest spot to diablo, so if he moves to you, you move away, but not far, so he keeps on chasing you
				if (!spot || dia && (dia.distance < 10 || dia.distance > 35)) {
					spot = safeSpots[calcNewSpot()];
				}

				// print(spot.toSource());
				spot.distance > 3 && spot.moveTo();

				// Cast @ the center
				// print('suposed to casting blizzard on his head');
				// dia && dia.cast(sdk.skills.Blizzard) || me.cast(sdk.skills.Blizzard, 0, star.x, star.y);
				me.overhead('casting firebolt instead of blizzard to test');
				dia && dia.cast(sdk.skills.FireBolt) || me.cast(sdk.skills.FireBolt, 0, star.x, star.y);
				delay(10);
			} while (!dia || !dia.dead);
		}


		doRun('viz');
		doRun('seiz');
		doRun('inf');

		diablo();


		// doPart(, [393,392], 2853); // inf
		// doPart([[7767, 5147], [7820, 5147]][seisLayout], [394], 2852); // seiz
		// doPart([[7708, 5269], [7647, 5267]][vizLayout], [395, 396], 2851); // vizer


	};

})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);