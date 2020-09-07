/***
 * @author Jaenster
 * @description An attempt to make auto equipment just work, automatically.
 */

(function (module, require) {
	const Pickit = require('./Pickit');
	const Promise = require('./Promise');
	const GameData = require('./GameData');
	const Town = require('./Town');
	const Pather = require('./Pather');

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

	//ToDo: Need to tell the system if its for me or a merc?

	function formula(item) {
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
			beltsize = () => !(item.code === "lbl" || item.code === "vbl") ? !(item.code === "mbl" || item.code === "tbl") ? 4 : 3 : 2,
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
					+ (res() * 200)
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

				rare: () => (res() * 100000)
					+ (elementDmg() * 50000)
					+ ((strdex() + vita()) * 10000)
					+ ((fbr() + ctb()) * 1000)
					+ def(),
			},

			_oldring: {
				magic: () => (res() * 1000)
					+ ((hpmp() + strdex()) * 100)
					+ fcr(),

				rare: () => (res() + fcr() * 10000)
					+ ((hpmp() + strdex()) * 1000),
			},

			ring: {
				magic: () => (fcr() * 1000) + (res() * 10) + ((hpmp() + strdex()) * 100),

				rare: () => (fcr() * 1000) + (res() * 10) + ((hpmp() + strdex()) * 100),
			},

			belt: {
				magic: () => (res() * 10000)
					+ (beltsize() * 10000)
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
			// throw Error('Should not happen?');
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

		let bias = 1;

		// if eth
		if (item.getFlag(0x400000)) {
			bias += 0.10; // A fix'd negative point of 10%

			// And increase this negativity scale for its state, so a nearly broken item will be quicker replaced with something better
			bias += 1 - (1 / item.getStat(sdk.stats.Maxdurability) * item.getStat(sdk.stats.Durability));
		}

		if (isRuneword || item.quality >= quality.rare) {
			if (typeof rareTier === 'function') {
				let tier = rareTier();
				// console.debug('rare tier -- '+item.name+ ' -- '+tier);
				return tier;
			}
			return 0;
		}
		// magical, or lower
		if (typeof magicTier === 'function') {
			let tier = magicTier();
			// console.debug('magic tier -- '+item.name+ ' -- '+tier);
			return tier;
		}
		return 0;


	}

	// Sort by rating, and after that by location (by same rating, prefer an item that is already equipped)
	const sortItems = (a, b) => {
		let fa = formula(a);
		let fb = formula(b);
		if (fb === fa) {
			return a.isEquipped ? -1 : 1;
		}
		return fb - fa;
	};

	/**
	 * @param {Item[]} items
	 * @returns Item[] */
	const compareRetAll = (items) => items.sort(sortItems);

	/** @returns Item */
	const compare = (...args) => compareRetAll(args)
		.first();

	const dependencies = {};
	dependencies[sdk.itemtype.bow] = sdk.items.arrows;
	dependencies[sdk.items.arrows] = sdk.itemtype.bow;
	dependencies[sdk.itemtype.crossbow] = sdk.items.bolts;
	dependencies[sdk.items.bolts] = sdk.itemtype.crossbow;

	const hasDependency = item => {
		let dep = dependencies[item.classid] || dependencies[item.itemType];
		return !!dep;
	};

	function AutoEquip() { // So we can call new upon it. Not sure why yet

	}

	AutoEquip.want = function (item) {
		return item.__wanted__by_AutoEquip = (function () {
			if (!item) return false; // We dont want an item that doesnt exists

			// no quest items
			if (['msf','vip'].includes(item.code)) return false;

			// If we already excluded this item, lets not rerun this
			if (item.hasOwnProperty('__wanted__by_AutoEquip') && !item.__wanted__by_AutoEquip) return false;

			const bodyLoc = item.getBodyLoc();
			if (!bodyLoc) return false; // Only items that we can wear

			const forClass = item.charclass;
			if (forClass >= 0 && forClass <= 6 && forClass !== me.classid) {
				//Item is for another class as me
				return false;
			}

			if (!item.identified) { // Tell the network we need to identify it first
				return -1; // We want to identify this
			}
			
			if (hasDependency(item)) {
				// TODO: item require an other item to be used (bow, crossbow)
				return false;
				//quantity * 100 / getBaseStat("items", quiver.classid, "maxstack")
				/*const stock = me.getItemsEx()
					.filter(i => i.classid == dependency && ((i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory) || i.mode == sdk.itemmode.equipped));
				if (stock.length) {
					return 1;
				}
				// can't use this item as we don't have the dependency
				return -1;*/
			}

			/** @type Item[]*/
			const currentItems = me.getItemsEx()
				.filter(item => item.isEquipped && bodyLoc.includes(item.bodylocation))
				.sort(sortItems);


			// This item's specs are already fully readable
			if (item.identified) {

				// no point in wanting items we cant equip
				if (item.getStat(sdk.stats.Levelreq) > me.getStat(sdk.stats.Level) || item.dexreq > me.getStat(sdk.stats.Dexterity) || item.strreq > me.getStat(sdk.stats.Strength)) {
					return false;
				}

				//ToDo; check if the item is vendored, and if we can afford it

				if (currentItems.length) {
					let items = [item].concat(currentItems);

					// Compare the items. The highest rating is the best item, the lowest rating is the worst item
					// In case of multiple slots (e.g. rings), this tells us which ring we want to replace this ring with.
					let compared = compareRetAll(items);

					// we want item if it is better than the worst equipped for this slot
					return compared.indexOf(item) < compared.indexOf(currentItems.last());
				}
			}
			return !!item.getBodyLoc(); // for now, we want all items that we can equip
		}).call();
	};

	AutoEquip.handle = function (item) {
		const dealWithIt = item => {
			item.__wanted__by_AutoEquip = (function () {
				// console.debug('DEALING WITH IT -- ' + item.name + '. Tier ' + tier);
				// We got it now, but somehow... dont want it anymore?
				if (!AutoEquip.want(item)) {
					return false;
				}
				
				if (hasDependency(item)) {
					// TODO: item require an other item to be used (bow, crossbow)
					return false;
					//quantity * 100 / getBaseStat("items", quiver.classid, "maxstack")
					/*const stock = me.getItemsEx()
						.filter(i => i.classid == dependency && ((i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory) || i.mode == sdk.itemmode.equipped));
					if (stock.length) {
						return 1;
					}
					// can't use this item as we don't have the dependency
					return -1;*/
				}

				const tier = formula(item);

				let bodyLocs = item.getBodyLoc();
				let currentSlots = bodyLocs.map(loc => ({location: loc, item: me.getItemsEx()
						.filter(item => {
							if (item.twoHanded && item.getBodyLoc().includes(loc)) {
								return item.isEquipped;
							}
							return item.isEquipped && item.bodylocation === loc;
						})
						.first()
					}))
					.sort((a, b) => {
						if (!a.item) {
							return -1;
						}
						if (!b.item) {
							return 1;
						}
						return compare(a.item, b.item) === a.item ? 1 : -1
					});
				
				// currentSlots sorted by formula ascending (index 0 is worse than index 1)
				let emptySlot = currentSlots.filter(s => !s.item).first();
				let old;
				if (emptySlot) {
					old = item.equip(emptySlot.location);
				}
				else {
					for (var i = 0; i < currentSlots.length && !old; i++) {
						// if item is better than current, equip it
						if (compare(currentSlots[i].item, item) === item) {
							old = item.equip(currentSlots[i].location);
						}
					}
				}

				// Sometimes it happens the OLD item seems better once we have the new one in place
				// Was the old item better?
				if (old && old.unequiped && old.unequiped.length) {
					const newTier = formula(old.unequiped.first());
					if (newTier > tier) {
						let res = !!old.rollback();
						return res; // Rollback and return
					}
				}
				
				return true;
			}).call()
		};

		const identify = gid => {
			console.debug('identifing');
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

			console.debug('Identified cursor? ' + (getCursorType() === 6));
			// Try to id the item, 3 attempts
			for (let i = 0, timer = getTickCount();
				 i < 3 && !item.identified;
				 i++, timer = getTickCount()
			) {
				console.debug('send packet of identifing');
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
		};

		const tome = me.findItem(519, 0, 3);
		if (tome && !item.identified && item.location === sdk.storage.Inventory) {
			const gid = item.gid;

			console.debug('identify?');
			// if we are in town, we can identify
			identify(gid); // So lets
		}

		return item.identified && dealWithIt(item);
	};

	/**
	 * @param {Item[]} items
	 * @return Item
	 */
	AutoEquip.shop = function (items) {
		console.debug('AutoEquip shopping for items');

		// first an object that contains the items per bodylocation
		return items.reduce((acc, item) => {
			const bodyloc = item.getBodyLoc().first(); // rings are not for sale so who cares about multiple slots;

			(acc[bodyloc] = acc[bodyloc] || []).push(item);

			return acc;
		}, new Array(sdk.body.LeftArmSecondary + 1))
			// now this is an array per body location
			.map((/**@type Item[]*/items, bodyloc) => {
					/** @type Item*/
					const currentItem = me.getItemsEx()
						.filter(item => item.isEquipped && item.bodylocation === bodyloc)
						.first();

					const currentRating = !currentItem ? -Infinity : formula(currentItem);

					// calculate the actual rating of this item
					return items.map(item => {
						let ratingThisItem = formula(item);
						if (ratingThisItem < currentRating) return false;

						// Avoid issues like dual handed items and such
						if (!AutoEquip.want(item)) return false;

						//ToDo; calculate formula for 2 handed weapons
						return ({
							item: item,
							rating: ratingThisItem,
							price: item.getItemCost(0), // 0 = to buy
							currentRating: currentRating,
						});

					})
						// filter out those that are worse as we got and those that we can afford
						.filter(obj => {
								return obj && currentRating < obj.rating && obj.price < me.gold;
							} // Needs to be better
							// && currentRating - obj.rating > obj.rating * 0.10  // needs to be atleast 10% better if we buy the item
							// && obj.price < me.gold // can we afford it?
						) //ToDo; proper gold handeling
						.sort((a, b) => b.rating - a.rating) // higher is better
						.first();
				}
			)
			// filter out those options without a result
			.filter(_ => !!_)
			.sort((a, b) => (b.rating - b.currentRating) - (a.rating - a.currentRating))
			.map(obj => obj.item);
	};

	AutoEquip.id = 'AutoEquip';
	AutoEquip.formula = formula;

	module.exports = AutoEquip;

	// Inject ourselfs into the pickit handlers
	Pickit.hooks.push(AutoEquip)
})
(module, require);