/**
 * @description Faster chicken.
 * @Author Jaenster
 */


(function (module, require, thread) {
	const Messaging = require('../modules/Messaging');

	const Config = require('../modules/Config');
	const hookOn = ['HealHP', 'HealMP', 'HealStatus', 'LifeChicken', 'ManaChicken', 'MercChicken', 'TownHP', 'TownMP', 'UseHP', 'UseRejuvHP', 'UseMP', 'UseRejuvMP', 'UseMercHP', 'UseMercRejuv', 'QuitWhenDead'];
	const realValues = hookOn.reduce((a, c) => {
		if (Config.hasOwnProperty(c)) {
			a[c] = Config[c]; // copy the value
			delete Config[c]; // remove it from the config
		}
		return a;
	}, {});

	hookOn.forEach(key => {
		Object.defineProperty(Config, key, {
			get: function () {
				return realValues[key]; // The real value
			},
			set: function (v) {
				const send = {};
				send[key] = v;
				Messaging.send({Chicken: {values: send}});
				return realValues[key] = v;
			}
		})
	});

	if (thread === 'thread') {
		Messaging.send({Chicken: {up: true}}); // send message to the to the normal client we are up
		print('ÿc2Jaensterÿc0 :: Chicken loaded');
		Messaging.on('Chicken', data => {
			if (!data || typeof data !== 'object') return;
			if (typeof data.values === 'object' && data.values) Object.keys(data.values).forEach(key => realValues[key] = data.values[key]);
		});

		const filterItemsWithMe = function (item) {
				return item.location === sdk.storage.Inventory || item.location === sdk.storage.Belt;
			},
			filterHPPots = function (item) {
				return item.classid > 586 && item.classid < 592;
			},
			filterMPPots = function (item) {
				return item.classid > 591 && item.classid < 597;
			},
			filterRevPots = function (item) {
				return item.classid === 515 || item.classid === 516;
			},
			sortBiggest = function (a, b) {
				return b.classid - a.classid;
			},
			self = this,
			timers = {
				hp: 0,
				mp: 0,
				rev: 0,
				revMerc: 0,
				hpMerc: 0,
			};

		// As we run now in our own thread, we can safely listen to packets. So lets
		addEventListener('gamepacket', function (bytes) {
			try {
				if (!bytes || bytes.length < 0 || bytes[0] !== 0x95) return false;// false, dont block packet

				if (me.inTown) return false; // not to do anything in town

				let packet = new DataView(bytes.buffer);
				packet = { // thanks to Nishimura-Katsuo <3
					hp: packet.getUint32(1, true) & 0x7FFF,
					mp: (packet.getUint32(2, true) & (0x7FFF << 7)) >> 7,
					stamina: (packet.getUint32(4, true) & (0x7FFF << 6)) >> 6,
					hpregen: (packet.getUint32(6, true) & (0x7F << 5)) >> 5,
					mpregen: (packet.getUint32(7, true) & (0x7F << 4)) >> 4,
				};

				//ToDo: Should have an packet based update for going to town. So, we avoid here a an array.indexof function @ me.inTown.

				const procentHP = 100 / me.hpmax * packet.hp;
				const procentMP = 100 / me.mpmax * packet.mp;
				const procentHPMerc = getMercHP();
				const merc = me.getMerc();

				if (procentHP < realValues.LifeChicken || procentMP < realValues.ManaChicken) { // First check chicken on HP. After that mana.
					print('Chicken');
					quit(); // Quitting
				}
				const tickRev = getTickCount() - timers.rev;
				const tickHP = getTickCount() - timers.hp;
				const tickMP = getTickCount() - timers.mp;
				const tickRevMerc = getTickCount() - timers.revMerc;
				const tickHPMerc = getTickCount() - timers.hpMerc;

				// Rev pots, Only every 250 ms. Should be enough
				if ((procentHP < realValues.UseRejuvHP || procentMP < realValues.UseRejuvMP) && tickRev > 250) {
					let revPot = me.getItemsEx().filter(filterRevPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (revPot) {
						revPot.interact();
						timers.rev = getTickCount();
						print('ÿc:Drank a Rev Pot');
						return false; // dont block the packet
					}
				}

				// Normal pots, Only every 1000 ms. Should be enough
				if ((procentHP < realValues.UseHP) && tickHP > 200 && !me.getState(sdk.states.Healthpot)) {
					let hp = me.getItemsEx().filter(filterHPPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (hp) {
						print('ÿc:Drank a ' + hp.name + ' Pot');
						hp.interact();
						timers.hp = getTickCount();
						return false; // dont block the packet
					}
				}

				// Normal pots, Only every 1000 ms. Should be enough
				if ((procentMP < realValues.UseMP) && tickMP > 200&& !me.getState(sdk.states.Manapot)) {
					let mp = me.getItemsEx().filter(filterMPPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (mp) {
						print('ÿc:Drank a ' + mp.name + ' Pot');
						mp.interact();
						timers.mp = getTickCount();
						return false; // dont block the packet
					}
				}

				// Take care of our sweet merc (rev pot)
				if (merc && procentHPMerc < realValues.UseRejuvHP && tickRevMerc > 500) {
					let revPot = me.getItemsEx().filter(filterRevPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (revPot) {
						clickItem(2, revPot);
						timers.revMerc = getTickCount();
						print('ÿc:Gave Rev Pot to merc');
						return false; // dont block the packet
					}
				}


				// Take care of our sweet merc (hp pot)
				if (merc && procentHPMerc < realValues.UseHP && tickHPMerc > 2500) {
					let hp = me.getItemsEx().filter(filterHPPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (hp) {
						print('ÿc:Drank a ' + hp.name + ' Pot');
						clickItem(2, hp);
						timers.hpMerc = getTickCount();
						return false; // dont block the packet
					}
				}
			} catch (e) {
				print(e);
				print(e.message);
			}
			return false; // dont block the packet
		});

		const Worker = require('../modules/Worker');
		Worker.runInBackground.DeathHandler = function() {
			if (me.dead && realValues['QuitWhenDead']) {
				print('Died.. Quitting');
				quit();
			}
			return true; // Keeps it looping =)
		};

		while (true) delay(1000);
	} else {
		// Once the thread sends the message, its up. Send the initial data
		Messaging.on('Chicken', data => data.hasOwnProperty('up') && data.up && Messaging.send({Chicken: {values: realValues}}));
	}

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require, getScript.startAsThread());
