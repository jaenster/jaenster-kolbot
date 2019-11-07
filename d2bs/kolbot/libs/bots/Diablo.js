/**
 * @author Jaenster
 * @description An improved version of a diablo run.
 */
function Diablo(Config, Attack, Pickit, Pather, Town) {
	const Promise = require('Promise'),
		TownPrecast = require('TownPrecast'),
		Precast = require('Precast');

	let diaSort = function (a, b) {
			// Entrance to Star / De Seis
			if (me.y > 5325 || me.y < 5260) {
				return b.y - a.y;
			}

			// Vizier
			if (me.x < 7765) {
				return b.x - a.x;
			}

			// Infector
			if (me.x > 7825) {
				if (!checkCollision(me, a, 0x1)) {
					return b.x - a.x;
				}
				return 1;
			}

			return a.distance - b.distance;
		},
		entrance = {x: 7797, y: 5556}, star = {x: 7792, y: 5292}, diaTick = false, parts = [],
		part = function (name, seals, locale) {
			let getPresets = () => getPresetUnits(108, 2).filter(ps => seals.indexOf(ps.id) > -1);
			parts.push(function () {
				// Do a seal
				if (diaTick) return diaTick; // Dont do anything if dia is done
				return getPresets().some(function (seal) {
					if (diaTick) return diaTick;
					// Clear to seal
					!diaTick && !Config.Diablo.Fast && seal.path.forEach(node => !diaTick && node.moveTo() && Attack.clear(40));

					// move to right position to "click" seal
					!diaTick && Pather.moveTo(seal.roomx * 5 + seal.x + (seal.id === 394 ? 5 : 2), seal.roomy * 5 + seal.y + (seal.id === 394 ? 5 : 0));

					// click on the seal.
					!diaTick && Diablo.openSeal(seal.unit);


					// Is it an active seal?
					if (!diaTick && [sdk.units.DiabloSealVizierActive, sdk.units.DiabloSealInfectorActive, sdk.units.DiabloSealSeizActive].indexOf(seal.id) > -1) {
						(_ => {
							let sealy = seal.roomy * 5 + seal.y;
							switch (seal.unit.classid) {
								case sdk.units.DiabloSealInfectorActive:
									return sealy === 7773 ? [me.x, me.y] : [7928, 5295];
								case sdk.units.DiabloSealSeizActive:
									return sealy === 7893 ? [7771, 5196] : [7798, 5186];
							}
							//case sdk.units.DiabloSealVizierActive:
							return sealy === 5275 ? [7691, 5292] : [7695, 5316]
						})().moveTo();

						let boss, timer = getTickCount(), estimation = 4e3;
						do {
							boss = getUnit(1, getLocaleString(locale));
							if (getTickCount() - timer > estimation || diaTick) {
								print('Failed waiting for ' + getLocaleString(locale));
								return diaTick;//break;
							}
						} while (!boss);

						return diaTick || !(Config.Diablo.Fast && Attack.kill(boss) || Attack.clear(40, 0, getLocaleString(locale), diaSort));
					}
					return diaTick;
				});
			});
		};

	new Promise(resolve => diaTick && resolve()).then(function () { // All seals done; Time to go do dia
		const PreAttack = require('PreAttack');
		//Do dia
		star.moveTo(); // go to star
		let diablo;

		do {
			//ToDo; Writer some decent preattack for here
			delay(10);
			PreAttack.do(sdk.monsters.Diablo1, 15e3 - (getTickCount() - diaTick), star);
		} while (!(diablo = getUnit(1, sdk.monsters.Diablo1)));

		Attack.kill(sdk.monsters.Diablo1);
		throw Error(md5('diadone'));
	});


	if (!Config.Diablo.Follower) {
		// Cast portal once in chaos
		Config.Diablo.Entrance && new Promise(resolve => entrance.distance < 5 && resolve()).then(Pather.makePortal);

		// cast portal once close to star
		new Promise(resolve => star.distance < 15 && resolve()).then(Pather.makePortal);

		Town(); // Do the chores
		Pather.useWaypoint(107);
		Precast();
	} else {
		// town precast if possible, or go bo
		!TownPrecast() && Precast.outTown();

		Town();
		Town.goToTown(4); // make sure we really are in act 4
		Town.move("portalspot");
		print('wait for portal');
		for (let i = 0; i < 30 * 10; i += 1) {
			if (Pather.usePortal(sdk.areas.ChaosSanctuary, null)) break;
			delay(100);
		}
		if (!me.area === sdk.areas.ChaosSanctuary) throw Error('failed going to chaos');
	}


	if (Config.Diablo.Entrance) { //ToDo; change to "doing entrance"
		entrance.moveTo();
		star.path.forEach(node => node.moveTo() && Attack.clear(30));
	}

	const Messaging = require('Messaging');

	Messaging.on('Diablo', function (data) {
		if (data.hasOwnProperty('diaTick')) {
			diaTick = data.diaTick;
		}
	});

	try {
		star.moveTo();

		part('vizier', [sdk.units.DiabloSealVizierInactive, sdk.units.DiabloSealVizierActive], sdk.locale.monsters.GrandVizierOfChaos);
		part('seiz', [sdk.units.DiabloSealSeizActive], sdk.locale.monsters.LordDeSeis);
		part('infector', [sdk.units.DiabloSealInfectorInActive, sdk.units.DiabloSealInfectorActive], sdk.locale.monsters.InfectorOfSouls);


		parts.forEach(_ => _());
		star.moveTo();
		delay(1000); // seems a bit stupid, but this catches the throw "error" of pwning diablo
	} catch (e) {
		print(e.message);
		// Dia is done, we dont care
		if (e.message !== md5('diadone')) {
			throw e; // keep on throwing
		}

	} finally { // Dont care for errors, just want to make sure the packet handler is removed after it
		Messaging.send({Diablo: {done: true}});
	}
}

Diablo.openSeal = function (seal) {
	for (let i = 0; i < 5; i += 1) {
		if (seal.mode) return true;

		if (seal.classid === 394) {
			Misc.click(0, 0, seal);
		} else {
			seal.interact();
		}

		delay(seal.classid === 394 ? 1000 : 500);

		if (seal.mode || i === 5) return !!seal.mode;

		if (seal.classid === 394 && Attack.validSpot(seal.x + 15, seal.y)) { // de seis optimization
			Pather.moveTo(seal.x + 15, seal.y);
		} else {
			Pather.moveTo(seal.x - 5, seal.y - 5);
		}

		delay(500);
	}
	return seal.mode; // cant come here, but still
};

// Thread wrapper
(function () {
	let currentFile = 'libs/bots/Diablo.js';

	if (getScript(currentFile) && getScript(currentFile).name === getScript(true).name) {
		// Running as thread
		include('require.js'); // start the framework
		const Messaging = require('Messaging');
		let diaTick = 0, done = false;
		const gamepacketHandler = bytes =>
			bytes // If bytes is set
			&& bytes.hasOwnProperty(0) // if it has the property 0 (it isnt an array)
			&& bytes[0] === 0x89 // If the firste is "special game event"
			&& Messaging.send({Diablo: {diaTick: diaTick = getTickCount() - (me.ping / 2)}})
			&& false; // dont block the packet by always returning false

		Messaging.on('Diablo', function (data) {
			if (data.hasOwnProperty('done')) {
				done = data.done;
			}
		});
		addEventListener('gamepacket', gamepacketHandler);
		while (!diaTick) {
			delay(3);
			if (done) break; // if message recved we are done, quit
		}
		removeEventListener('gamepacket', gamepacketHandler);
		getScript(true).stop(); // kill ourselfs

	} else if (!getScript(currentFile)) {
		load(currentFile); // boot the thread
	}
})();