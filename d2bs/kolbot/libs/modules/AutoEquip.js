/***
 * @author Jaenster
 * @description An attempt to make auto equipment just work, automatically.
 */

(function (module, require) {
	const Pickit = require('../modules/Pickit');
	const Promise = require('../modules/Promise');
	const GameData = require('../modules/GameData');
	const Town = require('../modules/Town');
	const Pather = require('../modules/Pather');

	let bestSkills = [];
	(function () {
		let level = me.charlvl;

		// Recalculate everything when we are lvl up
		const promiser = () => new Promise(resolve => me.charlvl !== level && resolve(getTickCount()))
			.then((time) => // First wait 4 seconds
				new Promise(resolve => getTickCount() - time > 1e4 && resolve())
					.then(calculateSkills)
			);

		const calculateSkills = function () {
			promiser(); // Set the promise up.

			bestSkills = GameData.mostUsedSkills(true).map(sk => {
				// We want to know some stuff of the skill
				return {
					skillId: sk.skillId,
					used: sk.used,
					type: GameData.damageTypes[getBaseStat('skills', sk.skillId, 'EType')],
				}
			});
		};
		calculateSkills();
	}).call();

	function formula(item) {
		// + item.getStatEx(sdk.stats.AddskillTab, 10) //ToDO; Fix tab skill we use the most ;)
		const skills = () => {
				let val = item.getStatEx(sdk.stats.Allskills) + item.getStatEx(sdk.stats.Addclassskills, me.classid);

				// Calculate imported skill tabs.
				const tabs = [],
					char = sdk.skillTabs[['amazon', 'sorc', 'necro', 'paladin', 'barb', 'druid', 'assassin'][me.classid]];

				// Loop over all skill tabs of this char
				// And push every skill that has a tab
				Object.keys(char).forEach(types => char[types].skills.some(sk => bestSkills.find(bsk => bsk.skillId === sk)) && tabs.push(char[types].id));

				// Sum total value of all tabs
				val += tabs
					.filter((v, i, s) => s.indexOf(v) === i) // Filter to only have uniques (shouldnt happen, better safe as sorry)
					.reduce((a, tab) => a + item.getStatEx(sdk.stats.AddskillTab, tab), 0); // Sum them

				// Take care of specific + skills
				val += bestSkills.reduce((a, c) => a
					+ item.getStatEx(sdk.stats.Addclassskills, c) // + skills on item
					+ item.getStatEx(sdk.stats.Nonclassskill, c) // + o skills. Dont think it will happen, but, we wouldnt mind if it did happen
					, 0);

				return val * 10; // Boost the value, +1 skills are worth allot
			}, // get all skills

			// Take care of the elemental damage of your best skill. (facets/eschutas/the lot)
			elementDmg = () => bestSkills.reduce(function (a, c) {
				if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Mastery')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Mastery']); // + skill damage
				if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Pierce')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Pierce']); // - enemy resistance
				return a;
			}, 0),

			// ToDo; take in account the current resistance. Because at some point, enough is enough
			res = () => (item.getStatEx(sdk.stats.Fireresist)
				+ item.getStatEx(sdk.stats.Coldresist)
				+ item.getStatEx(sdk.stats.Lightresist)
			),
			strdex = () => item.getStatEx(sdk.stats.Strength)
				+ item.getStatEx(sdk.stats.Dexterity),
			vita = () => item.getStatEx(sdk.stats.Vitality),
			hpmp = () => item.getStatEx(sdk.stats.Maxhp)
				+ item.getStatEx(sdk.stats.Maxmana)
				+ item.getStatEx(sdk.stats.PerLevelHp) / 2048 * me.charlvl
				+ item.getStatEx(sdk.stats.PerLevelMana) / 2048 * me.charlvl,
			fcr = () => item.getStatEx(sdk.stats.Fastercastrate),
			fbr = () => item.getStatEx(sdk.stats.Fasterblockrate),
			def = () => item.getStatEx(sdk.stats.Armorclass /*defense*/),
			fhr = () => item.getStatEx(sdk.stats.Fastergethitrate /* fhr*/),
			frw = () => item.getStatEx(sdk.stats.Fastermovevelocity /* fwr*/),
			ctb = () => item.getStatEx(sdk.stats.Toblock /*ctb = chance to block*/),
			ias = () => {
				// This is a tricky one. A sorc, doesnt give a shit about IAS.
				// 0='amazon',1='sorc',2='necro',3='paladin',4='barb',5='druid',6='assassin'
				// ToDo; make

			};

		const tiers = {
			helm: {
				magic: () => (skills() * 1000)
					+ (elementDmg() * 100)
					+ ((hpmp() + res()) * 100)
					+ def(),

				rare: () => (skills() * 10000)
					+ (elementDmg() * 1000)
					+ ((hpmp() + res()) * 1000)
					+ def()
			},

			amulet: {
				magic: () => (skills() * 1000)
					+ (res() * 1000)
					+ (strdex() * 100)
					+ (hpmp() * 10)
					+ (fcr() + fbr() + def()),

				rare: () => (skills() * 1000)
					+ (res() * 1000)
					+ (strdex() * 100)
					+ (hpmp() * 10)
					+ (ctb() * 100) // Safety crafted amulet
					+ (fcr() + fbr() + def()),


			},

			armor: {
				magic: () => (skills() * 10000)
					+ (res() * 1000)
					+ (elementDmg() * 1000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ def(),

				rare: () => (skills() * 100000)
					+ (res() * 10000)
					+ (elementDmg() * 10000)
					+ (strdex() * 10000)
					+ (hpmp() * 1000)
					+ def(),
			},

			weapon: {
				magic: () => (skills() * 10000)
					+ (elementDmg() * 5000)
					+ (res() * 1000)
					+ (hpmp() * 100)
					+ (strdex() * 10)
					+ fcr(),

				rare: () => ((skills()) * 10000)
					+ (elementDmg() * 5000)
					+ (res() * 1000)
					+ ((hpmp() + strdex()) * 1000)
					+ fcr()
			},
			shield: {
				magic: () => (res() * 10000)
					+ (elementDmg() * 5000)
					+ ((strdex() + vita()) * 1000)
					+ ((fbr() + ctb()) * 100)
					+ def(),

				set: () => (res() * 100000)
					+ (elementDmg() * 50000)
					+ ((strdex() + vita()) * 10000)
					+ ((fbr() + ctb()) * 1000)
					+ def(),
			},

			ring: {
				magic: () => (res() * 1000)
					+ ((hpmp() + strdex()) * 100)
					+ fcr(),

				rare: () => (res() + fcr() * 10000)
					+ ((hpmp() + strdex()) * 1000),
			},

			belt: {
				magic: () => (res() * 10000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ (fhr() * 10)
					+ def(),

				rare: () => (res() * 100000)
					+ (strdex() * 10000)
					+ (hpmp() * 1000)
					+ (fhr() * 10)
					+ def()
			},

			boots: {
				magic: () => (res() * 10000)
					+ ((strdex() + vita()) * 100)
					+ (hpmp() * 100)
					+ (frw() * 10)
					+ def(),

				rare: () => (res() * 100000)
					+ ((strdex() + vita()) * 10000)
					+ (hpmp() * 1000)
					+ (frw() * 10)
					+ def(),
			},

			gloves: {
				magic: () => ((res() + skills()) * 10000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ def(),

				rare: () => ((res() + skills()) * 100000)
					+ (strdex() * 10000)
					+ (hpmp() * 1000)
					+ def(),
			},

		};

		const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots

		if (!bodyLoc) return false; // Its not an equitable item


		const isRuneword = !!item.getFlag(0x4000000 /* runeword*/),
			tierFuncs = Object.keys(tiers).map(key => tiers[key])[bodyLoc - 1];

		if (tierFuncs === undefined) {
			print('klasdfjlkasdjflkasdjflkasdjflkasdjfkl --- ' + item.name);
			//throw Error('Should not happen?');
			return 0;
		}
		const [magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

		const quality = {
			lowquality: 1,
			normal: 2,
			superior: 3,
			magic: 4,
			set: 5,
			rare: 6,
			unique: 7,
			crafted: 8,
		};

		if (isRuneword || item.quality >= quality.rare) {
			if (typeof rareTier === 'function') {
				let tier = rareTier();
				print('TIER OF RARE -- ' + tier + ' -- ' + item.name);
				return tier;
			}
			print('Error? magicTier is not an function?');
			return 0;
		}
		// magical, or lower
		if (typeof magicTier === 'function') {
			let tier = magicTier();
			print('TIER OF MAGIC -- ' + tier + ' -- ' + item.name);
			return tier;
		}
		print('Error? magicTier is not an function?');
		return 0;


	}

	/**
	 * @description Returns the item that is best.
	 * @param a
	 * @param b
	 */
	const compare = (a, b) => formula(a) < formula(b) && b || a;

	function AutoEquip() { // So we can call new upon it. Not sure why yet

	}

	require('../modules/Debug');

	AutoEquip.want = function (item) {
		return item.__wanted__by_AutoEquip = (function () {
			// If we already excluded this item, lets not rerun this
			if (item.hasOwnProperty('__wanted__by_AutoEquip') && !item.__wanted__by_AutoEquip) return false;

			if (!item) return false; // We dont want an item that doesnt exists
			const bodyLoc = item.getBodyLoc().first();

			if (!bodyLoc) return false; // Only items that we can wear

			const forClass = getBaseStat("itemtypes", item.itemType, "class");
			if (forClass >= 0 && forClass <= 6 && forClass !== me.classid) {
				print('Item is for another class as me');
				return false;
			}

			const currentItem = me.getItemsEx()
				.filter(item => item.location === sdk.storage.Equipment && item.bodylocation === bodyLoc)
				.first();

			// This item's specs are already fully readable
			if (item.identified && currentItem) {
				print('items specs are fully readable -- ' + item.name);
				if (compare(currentItem, item) === item) {
					print('We seem to prefer this item, over ' + currentItem.name + ' will be replaced with ' + item.name);
					return true;
				} else {
					print('Current item is better, skip');
					return false;
				}
			}
			if (!item.identified) { // Tell the network we need to identify it first
				return -1; // We want to identify this
			}
			return !!item.getBodyLoc(); // for now, we want all items that we can equip
		}).call();
	};

	AutoEquip.handle = function (item) {
		print('Handle item?');
		function dealWithIt(item) {
			item.__wanted__by_AutoEquip = (function () {
				const tier = formula(item);
				print('DEALING WITH IT -- ' + item.name + '. Tier ' + tier);
				const bodyLoc = item.getBodyLoc().first(); // ToDo Deal with multiple slots, like rings
				const currentItem = me.getItemsEx()
					.filter(item => item.location === sdk.storage.Equipment && item.bodylocation === bodyLoc)
					.first();

				// No current item? Im pretty sure we want to equip it then
				if (!currentItem) return item.bodyloc === bodyLoc;

				// Is the current item better as the new item?
				if (compare(item, currentItem) !== item) return false; // No need to replace

				// Is the new item better as the old item?
				const old = item.equip(bodyLoc);

				// Sometimes it happens the OLD item seems better once we have the new one in place
				const newTier = old && old.unequiped && formula(old.unequiped.first()) || 0;

				// Was the old item better?
				if (newTier > tier) return !!old.rollback(); // Rollback and return false

				return true;
			}).call()
		}

		function identify(gid) {
			print('identifing');
			let returnTo = {area: me.area, x: me.x, y: me.y};
			// We can id right now. So lets

			// it can be a while ago, got the tome
			let tome = me.findItem(519, 0, 3); // ToDo Use loose scrolls
			if (tome) {
				const item = getUnits(4, -1, -1, gid).first();
				if (!tome || !item) {
					return; // Without an tome or item, we cant id the item
				}

				// send the packet we right click on the tome

				//  3 attempts
				for (let i = 0, timer = getTickCount();
					 i < 3 && getCursorType() !== 6;
					 i++, timer = getTickCount()
				) {
					sendPacket(1, 0x27, 4, gid, 4, tome.gid);
					while (getCursorType() !== 6) {
						delay(3);
						if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
					}
				}
			} else { // Dont have a tome

				//ToDo; go to cain if he is closer by and we dont have scrolls & nothing else to identify

				Town.goToTown();
				// Lets go to town to identify
				const npc = Town.initNPC("Shop", "identify");
				const scroll = npc.getItem(sdk.items.idScroll);
				scroll.buy();
				tome = scroll;
			}

			print('Identified cursor? ' + (getCursorType() === 6));
			// Try to id the item, 3 attempts
			for (let i = 0, timer = getTickCount();
				 i < 3 && !item.identified;
				 i++, timer = getTickCount()
			) {
				print('send packet of identifing');
				getCursorType() === 6 && sendPacket(1, 0x27, 4, gid, 4, tome.gid);
				while (!item.identified) {
					delay(3);
					if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
				}
			}


			let failed;
			if ((failed = !(item.identified && dealWithIt(item)))) item.__wanted__by_AutoEquip = false; // Somehow failed, give up

			if (returnTo.area !== me.area) {
				Town.moveToSpot('portal');
				Pather.usePortal(returnTo.area);
				Pather.moveTo(returnTo.x, returnTo.y);
			}

			return !failed;
		}

		const tome = me.findItem(519, 0, 3);
		if (tome && !item.identified && item.location === sdk.storage.Inventory) {
			const gid = item.gid;

			print('identify?');
			// if we are in town, we can identify
			identify(gid); // So lets
		}

		return item.identified && dealWithIt(item);
	};

	AutoEquip.id = 'AutoEquip';
	AutoEquip.formula = formula;

	module.exports = AutoEquip;

	// Inject ourselfs into the pickit handlers
	Pickit.hooks.push(AutoEquip)
})
(module, require);