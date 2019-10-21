/***
 * @author Jaenster
 * @description An attempt to make auto equipment just work, automatically.
 */

(function (module, require) {
	const Pickit = require('Pickit');
	const Promise = require('Promise');

	function formula(item) {
		const skills = () =>
			item.getStatEx(sdk.stats.Allskills) // get all skills
			//+ item.getStatEx(sdk.stats.AddskillTab, 10) //ToDO; Fix tab skill we use the most ;)
			+ item.getStatEx(sdk.stats.Addclassskills, me.classid), // Get class skills of my classid
			res = () => (
				(
					item.getStatEx(sdk.stats.Fireresist)
					+ item.getStatEx(sdk.stats.Coldresist)
					+ item.getStatEx(sdk.stats.Lightresist)
				) * 1000
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
			ctb = () => item.getStatEx(sdk.stats.Toblock /*ctb = chance to block*/);


		const tiers = {
			helm: {
				magic: () => (skills() * 1000)
					+ ((hpmp() + res()) * 100)
					+ def(),

				rare: () => (skills() * 10_000)
					+ ((hpmp() + res()) * 1000)
					+ def(),
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
					+ (fcr() + fbr() + def()),


			},

			armor: {
				magic: () => ((skills() + res()) * 10_000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ def(),

				rare: () => ((skills() + res()) * 100_000)
					+ (strdex() * 10_000)
					+ (hpmp() * 1000)
					+ def(),
			},

			weapon: {
				magic: () => ((res() + skills()) * 1000)
					+ (hpmp() * 100)
					+ (strdex() * 10)
					+ fcr(),

				rare: () => () => ((skills() + res()) * 10_000)
					+ ((hpmp() + strdex()) * 1000)
					+ fcr()
			},
			shield: {
				magic: () => (res() * 10000)
					+ ((strdex() + vita()) * 1000)
					+ ((fbr() + ctb()) * 100)
					+ def(),

				set: () => (res() * 100_000)
					+ ((strdex() + vita()) * 10_000)
					+ ((fbr() + ctb()) * 1000)
					+ def(),
			},

			ring: {
				magic: () => (res() * 1000)
					+ ((hpmp() + strdex()) * 100)
					+ fcr(),

				rare: () => (res() * 10_000)
					+ ((hpmp() + strdex()) * 1000)
					+ fcr(),
			},

			belt: {
				magic: () => (res() * 10_000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ (fhr() * 10)
					+ def(),

				rare: () => (res() * 100_000)
					+ (strdex() * 10_000)
					+ (hpmp() * 1000)
					+ (fhr() * 10)
					+ def()
			},

			boots: {
				magic: () => (res() * 10_000)
					+ ((strdex() + vita()) * 100)
					+ (hpmp() * 100)
					+ (frw() * 10)
					+ def(),

				rare: () => (res() * 100_000)
					+ ((strdex() + vita()) * 10_000)
					+ (hpmp() * 1000)
					+ (frw() * 10)
					+ def(),
			},

			gloves: {
				magic: () => ((res() + skills()) * 10_000)
					+ (strdex() * 1000)
					+ (hpmp() * 100)
					+ def(),

				rare: () => ((res() * skills()) * 100_000)
					+ (strdex() * 10_000)
					+ (hpmp() * 1000)
					+ def(),
			},

		};

		const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots

		if (!bodyLoc) return false; // Its not an equitable item

		const isRuneword = !!item.getFlag(0x4000000 /* runeword*/),
			tierFuncs = Object.values(tier)[bodyLoc],
			[magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

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

		if (isRuneword || item.quality >= quality.magic) {
			return rareTier()
		} else { // magical, or lower
			return magicTier();
		}
	}

	/**
	 * @description Returns the item that is best.
	 * @param a
	 * @param b
	 */
	const compare = (a, b) => formula(a) < formula(b) && b || a;

	function AutoEquip() { // So we can call new upon it. Not sure why yet

	}

	AutoEquip.want = function (item) {
		return !!item.getBodyLoc(); // for now, we want all items that we can equip
	};

	AutoEquip.handle = function (item) {
		function dealWithIt(item) {
			const tier = formula(item);
			const bodyLoc = item.getBodyLoc().first(); // ToDo Deal with multiple slots, like rings
			const currentItem = me.getItems()
				.filter(item => item.location === sdk.storage.Equipment && item.bodylocation === bodyLoc)
				.first();

			// No current item? Im pretty sure we want to equip it then
			if (!currentItem) return item.bodyloc === bodyLoc;

			// Is the current item better as the new item?
			if (compare(item, currentItem) !== item) return false; // No need to replace

			// Is the new item better as the old item?
			const old = item.equip(bodyLoc);

			// Sometimes it happens the OLD item seems better once we have the new one in place
			const newTier = formula(old.unequiped.first());

			// Was the old item better?
			if (newTier > tier) return !!old.rollback(); // Rollback and return false

			return true;
		}

		const tome = me.findItem(519, 0, 3);
		if (tome && !item.getFlag(0x10) && item.location === sdk.storage.Inventory) {
			const gid = item.gid;

			// We need to identify. But maybe we cant right now?
			return new Promise(function (resolve) {
				// Check if we are in town
				if (me.inTown) {
					resolve();// We are
				}

				if (getUnits(1)
					.filter(monster => monster.attackable && monster.distance < 30 /*&& checkCollision(me,monster,0x04)*/)
					.length < 4
				) {
					// Right now, its relative safe to id the item
					resolve();
				}
			}).then(function () {
				// We can id right now. So lets

				// it can be a while ago, got the tome
				const tome = me.findItem(519, 0, 3); // ToDo Use loose scrolls
				const item = getUnits(4, -1, -1, gid).first();
				if (!tome || !item) {
					return; // Without an tome or item, we cant id the item
				}

				// send the packet we right click on the tome

				//  3 attempts
				for (let i = 0, timer = getTickCount();
					 i < 3 && getCursorType() !== 6;
					 i++, timer = getTickCount()
				)
					sendPacket(1, 0x27, 4, gid, 4, tome.gid);
				while (getCursorType() !== 6) {
					delay(3);
					if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
				}


				// Try to id the item, 3 attempts
				for (let i = 0, timer = getTickCount();
					 i < 3 && item.getFlag(0x10);
					 i++, timer = getTickCount()
				) {
					getCursorType() !== 6 && sendPacket(1, 0x27, 4, gid, 4, tome.gid);
					while (!item.getFlag(0x10)) {
						delay(3);
						if (getTickCount() - timer > 2e3) break; // Failed to id it. To bad
					}
				}

				if (item.getFlag(0x10)) dealWithIt(item);
			});
		}

		return item.getFlag(0x10) && dealWithIt(item);
	};

	AutoEquip.id = 'AutoEquip';

	module.exports = AutoEquip;

	// Inject ourselfs into the pickit handlers

	Pickit.hooks.push(AutoEquip)

})
(module, require);