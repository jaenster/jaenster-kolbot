/**
 * @description Faster chicken.
 * @Author Jaenster
 */


(function (module, require, thread) {
	const Messaging = require('Messaging');

	const Config = require('Config');
	const GameData = require('GameData');
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

				if (procentHP < realValues.LifeChicken || procentMP < realValues.ManaChicken) { // First check chicken on HP. After that mana.
					print('Chicken');
					quit(); // Quitting
				}
				const tickRev = getTickCount() - timers.rev;
				const tickHP = getTickCount() - timers.hp;
				const tickMP = getTickCount() - timers.mp;
				const tickRevMerc = getTickCount() - timers.revMerc;
				const tickHPMerc = getTickCount() - timers.hpMerc;

				let hpDiff = packet.hp-prevHP;
				let hpPercentDiff = procentHP-prevHPPercent;
				prevHP = packet.hp;
				prevHPPercent = procentHP;
				let diffPerSec = hpDiff * (1 + (1-delay/1000));
				print("packet.hp = "+packet.hp);
				print("procentHP = "+procentHP);
				print("hpDiff = "+hpDiff);
				print("hpPercentDiff = "+hpPercentDiff);
				print("diffPerSec = "+diffPerSec);


				let hppots = me.getItemsEx()
					.filter(filterItemsWithMe)
					.filter(filterHealthPots)
					.map(p => {
						p.effectPercent = GameData.potionEffect(p.classid)/me.hpmax*100;
						p.duration = GameData.Potions[p.classid].duration;
						p.diffToFull = Math.abs(procentHP+p.effectPercent-100);
						return p;
					});

				function evalPotion(p) {
					var res = 0;
					var factor = 1;
					if ([sdk.items.RejuvPotion, sdk.items.FullRejuvPotion].indexOf(p.classid)) {
						res += procentHP;
						//res += 1/(p.effectPercent-lifePercent)
					}
					//res += p.duration; // less duration, better
					//console.log(res)
					// disance to full refill taking into account loosing life (lifePerSec)
					var lifePerSecPercent = diffPerSec/me.hpmax*100
					var distanceToFull = procentHP + p.effectPercent + lifePerSecPercent*p.duration - 100;
					//console.log(distanceToFull)
					if (distanceToFull < 0) {
						// the potion effectPercent is not high enough to refill
						//res += 1/distanceToFull;
					}
					else {
						//res += 1
					}
					res += (distanceToFull == 0 ? 1 : distanceToFull);
					return 1/res*factor;
				}

				function sortPotions(a, b) {
					return evalPotion(a) - evalPotion(b);
				}
				//print(hppots);
				let nearestToFull = hppots.sort((a, b) => a.diffToFull - b.diffToFull).first();
				//print(nearestToFull.first().effectPercent/2);
				//print(nearestToFull.map(p => procentHP+p.effectPercent));
				if (nearestToFull && procentHP <= nearestToFull.effectPercent/2 && tickHP > 1000) {
					// you can take a potion

					let bestPot = hppots.sort(sortPotions).last();
					if (bestPot) {
						print('ÿc:Drank a ' + bestPot.name + ' Pot');
						print('ÿc:Pot effect ' + bestPot.effectPercent);
						bestPot.interact();
						timers.hp = getTickCount();
						return false; // dont block the packet
						//bestPot.interact();
						//delay(2000);
					}
				}

				// TODO: mediation aura rep mana (insight)
				// TODO: warmth skill rep mana
/*
				let itemsRegen = me.getItemsEx()
					.filter(i => i.mode == sdk.itemmode.equipped)
					.map(i => i.getStat(sdk.stats.Hpregen))
					.reduce((acc, s) => acc+s, 0);
				let regen = me.getStat(sdk.stats.Hpregen);
				let diffRegen = me.getStat(sdk.stats.Hpregen) - itemsRegen;
				if (diffRegen > 0) {
					// An hp potion is refilling your life
				}
				// print("ITEMS REGEN LIFE = "+itemsRegen);
				// print("TOTAL REGEN LIFE = "+regen);
				// print("BASE REGEN LIFE = "+diffRegen);

				//TODO: handle shrines

				let prayerState = me.getState(sdk.states.Prayer);
				let prayerSkill = me.getSkill(sdk.skills.Prayer, 1);
				// WARNING: prayer does not give regenHP stat, have to calculate skill level and regen value from skill level
				// print("PRAYER = "+prayerState+"    skill = "+prayerSkill);
				if (prayerState && !prayerSkill) {
					// can't say if prayer comes from items or another player
					let auraLevel = me.getItemsEx().filter(i => i.mode == sdk.itemmode.equipped)
						.map(i => i.getStat(sdk.stats.SkillOnAura, sdk.skills.Prayer))
						.sort()
						.last(); // best aura is used
					if (!auraLevel) {
						// prayer does not come from me, how to get level ?
					}
					else {
						// print("Prayer aura on me = "+auraLevel);
					}
					// print("Prayer aura on me = "+auraLevel);
				}
*/
/*
				let meditState = me.getState(sdk.states.Meditation);
				let meditSkill = me.getSkill(sdk.skills.Meditation, 1);
				//print("MEDITATION = "+meditState+"    skill = "+meditSkill);

				//let warmthState = me.getState(sdk.states.Warmth);
				let warmthSkill = me.getSkill(sdk.skills.Warmth, 1);
				if (warmthSkill) {
					// print("WARMTH = "+warmthSkill);
				}

				let regenMana = me.getStat(sdk.stats.Manarecovery);
				//print("REGEN MANA = "+regenMana);



				if (me.inTown) return false; // not to do anything in town





				if (regen >= 100) {
					// an hp potion is refilling my life (or I have a really good regen life item :) )
				}
*/
/*
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
				var thresholdHP = Math.min(realValues.UseHP, realValues.LifeChicken+10);
				if ((procentHP < thresholdHP) && tickHP > 1000) {
					let hppots = me.getItemsEx().filter(filterHPPots)
						.filter(filterItemsWithMe)
						.map(p => Object.assign(p, {effect: GameData.potionEffect(p.classid)/me.hpmax*100}))
						//.filter(p => (procentHP+p.effect-100) <= 0)
						.sort((a, b) => Math.abs(procentHP+a.effect-100) - Math.abs(procentHP+b.effect-100));

					print("pots effects : "+hppots.map(p => p.effect));
					// use the lesser potion that fully refills
					let hp = hppots.first();
					if (hp) {
						print('ÿc:Drank a ' + hp.name + ' Pot');
						hp.interact();
						timers.hp = getTickCount();
						return false; // dont block the packet
					}
				}
*/

				// Normal pots, Only every 1000 ms. Should be enough
				if ((procentMP < realValues.UseMP) && tickMP > 1000) {
					let mppots = me.getItemsEx().filter(filterMPPots)
						.filter(filterItemsWithMe)
						.map(p => Object.assign(p, {effect: GameData.potionEffect(p.classid)/me.hpmax*100}))
						.filter(p => (procentMP+p.effect-100) <= 0)
						.sort((a, b) => Math.abs(procentMP+a.effect-100) - Math.abs(procentMP+b.effect-100));
						// use the lesser potion that fully refill
					let mp = mppots.first();
					if (mp) {
						print('ÿc:Drank a ' + mp.name + ' Pot');
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

		const Worker = require('Worker');
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
