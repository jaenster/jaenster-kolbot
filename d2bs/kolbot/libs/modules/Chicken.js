/**
 * @description Faster chicken.
 * @Author Jaenster
 */


(function (module, require, thread) {
	const Messaging = require('./Messaging');

	const Config = require('./Config');
	const GameData = require('./GameData');
	const Skills = require('./Skills');
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
			filterHealthPots = function (item) {
				return filterHPPots(item) || filterRevPots(item);
			},
			sortBiggest = function (a, b) {
				return b.classid - a.classid;
			},
			filterPots = function (item) {
				return filterHPPots(item) || filterMPPots(item) || filterRevPots(item);
			},
			self = this,
			timers = {
				hp: 0,
				mp: 0,
				rev: 0,
				revMerc: 0,
				hpMerc: 0,
			};

		var time = getTickCount();
		var prevHP = me.hp;
		var prevHPPercent = me.hp/me.hpmax*100;

		// As we run now in our own thread, we can safely listen to packets. So lets
		addEventListener('gamepacket', function (bytes) {
			try {
				if (!bytes || bytes.length < 0 || bytes[0] !== 0x95) return false;// false, dont block packet

				var delay = getTickCount() - time;
				time = getTickCount();
				//print("gamepacket time = "+delay);

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

				const tickRev = getTickCount() - timers.rev;
				const tickHP = getTickCount() - timers.hp;
				const tickMP = getTickCount() - timers.mp;
				const tickRevMerc = getTickCount() - timers.revMerc;
				const tickHPMerc = getTickCount() - timers.hpMerc;

				let hpDiff = packet.hp-prevHP;
				let hpPercentDiff = procentHP-prevHPPercent;
				prevHP = packet.hp;
				prevHPPercent = procentHP;
				let diffPerSec = hpDiff * 1000 / delay;
				let lifePerSecPercent = diffPerSec / me.hpmax * 100;

				function evalPotion (p) {
					var res = 0;
					var factor = 1;
					if ([sdk.items.RejuvPotion, sdk.items.FullRejuvPotion].indexOf(p.classid)) {
						// the less life you have, the more efficient is a rejuv potion
						res += procentHP;
					}
					// disance to fully refill, taking into account loosing/gaining life (lifePerSec)
					var distanceToFull = p.diffToFull + lifePerSecPercent * p.duration;
					if (distanceToFull < 0) {
						// the potion effect is not high enough to refill to 100%
						// missing <distanceToFull>% to get to 100%
					}
					else {
						// the potion effect is <distanceToFull>% over refilling
						// aka, <distanceToFull>% of potion effect will be used for nothing
					}
					res += (distanceToFull == 0 ? 1 : distanceToFull);
					return 1/(res*factor);
				}

				let hppots = me.getItemsEx()
					.filter(filterItemsWithMe)
					.filter(filterHealthPots)
					.map(p => {
						p.effectPercent = GameData.potionEffect(p.classid) / me.hpmax * 100;
						p.duration = GameData.Potions[p.classid].duration;
						p.diffToFull = procentHP+p.effectPercent-100;
						p.score = evalPotion(p);
						return p;
					})
					//.filter(p => p.diffToFull <= 20)
					.sort((a, b) => a.score - b.score);

				let monstersAround = getUnits(sdk.unittype.Monsters)
					.filter(u => GameData.isEnemy(u) && u.distance <= 10)
					.map(m => {
						m.avgDmg = GameData.monsterAvgDmg(m.classid, m.area);
						m.maxDmg = Math.ceil(GameData.monsterMaxDmg(m.classid, m.area));
						return m;
					});

				let potentialAvgDmgTaken = monstersAround
					.reduce((total, m) => total + m.avgDmg, 0);
				let potentialDmgTakenPercent = potentialAvgDmgTaken / me.hpmax * 100;
				let chicken = (hpDiff < 0 || hppots.length == 0) && potentialDmgTakenPercent >= procentHP;
				if (chicken) { // First check chicken on HP. After that mana.
					print('Chicken');
					quit(); // Quitting
					return false;
				}

				let potentialMaxDmgTaken = monstersAround
					.reduce((total, m) => total + m.maxDmg, 0);
				let potentialMaxDmgTakenPercent = potentialMaxDmgTaken / me.hpmax * 100;
				let notFullPot = hppots.find(p => p.diffToFull < 0);
				let useHP = (potentialMaxDmgTakenPercent >= procentHP || notFullPot) && tickHP > 1000;
				let bestPot = notFullPot || hppots.last();
				if (useHP && bestPot) {
					print('ÿc:Drank a ' + bestPot.name);
					print('ÿc:Pot effect ' + bestPot.effectPercent + ' %');
					print('ÿc:Over refilling ' + bestPot.diffToFull + ' %');
					bestPot.interact();
					timers.hp = getTickCount();
					return false; // dont block the packet
				}


				// Normal pots, Only every 1000 ms. Should be enough
				let mostUsedSkill = GameData.mostUsedSkills(true).first();
				let maxSkillMana = mostUsedSkill ? Skills.manaCost[mostUsedSkill.skillId] : Math.max.apply(null, me.getSkill(4).map(s => Skills.manaCost[s[0]]));
				let manaCostPercent = maxSkillMana / me.mpmax * 100;
				if (procentMP <= manaCostPercent*2 && tickMP >= 1000) {
					let mp = me.getItemsEx()
						.filter(filterItemsWithMe)
						.filter(filterMPPots)
						.map(p => {
							p.effectPercent = GameData.potionEffect(p.classid) / me.mpmax * 100;
							p.duration = GameData.Potions[p.classid].duration;
							p.diffToFull = procentMP+p.effectPercent-100;
							return p;
						})
						.sort((a, b) => a.diffToFull - b.diffToFull)
						.first();
						// use the lesser potion that fully refill
					if (mp) {
						print('ÿc:Drank a ' + mp.name);
						print('ÿc:Pot effect ' + mp.effectPercent + ' %');
						print('ÿc:Over refilling ' + mp.diffToFull + ' %');
						mp.interact();
						timers.mp = getTickCount();
						return false; // dont block the packet
					}
				}

				// Take care of our sweet merc (rev pot)
				if (merc && procentHPMerc < realValues.UseRejuvHP && tickRevMerc > 250) {
					let revPot = me.getItemsEx().filter(filterRevPots).filter(filterItemsWithMe).sort(sortBiggest).first();
					if (revPot) {
						clickItem(2, revPot);
						timers.revMerc = getTickCount();
						print('ÿc:Gave Rev Pot to merc');
						return false; // dont block the packet
					}
				}


				// Take care of our sweet merc (hp pot)
				if (merc && procentHPMerc < realValues.UseHP && tickHPMerc > 250) {
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
