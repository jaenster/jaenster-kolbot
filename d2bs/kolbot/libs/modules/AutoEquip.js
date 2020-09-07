/***
 * @author Jaenster
 * @description An attempt to make auto equipment just work, automatically.
 */

(function (module, require) {
	const Town = require('./Town');
	const Pather = require('./Pather');


	//ToDo: Need to tell the system if its for me or a merc?

	// Sort by rating, and after that by location (by same rating, prefer an item that is already equipped)
	const sortItems = /**@this AutoEquip*/(a, b) => {
		let fa = this.formula(a);
		let fb = this.formula(b);
		if (fb === fa) {
			return a.isEquipped ? -1 : 1;
		}
		return fb - fa;
	};

	const dependencies = {};
	dependencies[sdk.itemtype.bow] = sdk.items.arrows;
	dependencies[sdk.items.arrows] = sdk.itemtype.bow;
	dependencies[sdk.itemtype.crossbow] = sdk.items.bolts;
	dependencies[sdk.items.bolts] = sdk.itemtype.crossbow;

	const hasDependency = item => {
		let dep = dependencies[item.classid] || dependencies[item.itemType];
		return !!dep;
	};

	const _defaults = {
		reference: me,
	};

	/**
	 * @constructor
	 */
	function AutoEquip(settings) { // So we can call new upon it. Not sure why yet
		Object.assign(this, settings, _defaults);
	}

	/**
	 * @param {Item[]} items
	 * @returns Item[]
	 */
	AutoEquip.prototype.compareRetAll = function (items) {
		return items.sort(sortItems.bind(this));
	};

	AutoEquip.prototype.compare = function (...args) {
		return this.compareRetAll(args).first();
	};

	AutoEquip.prototype.want = function (item) {
		let key = '__wanted__by_AutoEquip' + this.id;
		return item[key] = (function () {
			if (!item) return false; // We dont want an item that doesnt exists
			if (!this.reference) return false; // If we dont exists (in case of a merc)

			// no quest items
			if (['msf', 'vip'].includes(item.code)) return false;

			// If we already excluded this item, lets not rerun this
			if (item.hasOwnProperty('key') && !item[key]) return false;

			const bodyLoc = item.getBodyLoc();
			if (!bodyLoc.length) return false; // Only items that we can wear

			const forClass = item.charclass;
			if (forClass >= 0 && forClass <= 6 && forClass !== this.reference.classid) {
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
				/*const stock = this.reference.getItemsEx()
					.filter(i => i.classid == dependency && ((i.mode == sdk.itemmode.inStorage && i.location == sdk.storage.Inventory) || i.mode == sdk.itemmode.equipped));
				if (stock.length) {
					return 1;
				}
				// can't use this item as we don't have the dependency
				return -1;*/
			}

			/** @type Item[]*/
			const currentItems = (this.reference.getItemsEx() || [])
				.filter(item => item.isEquipped && bodyLoc.includes(item.bodylocation))
				.sort(sortItems);


			// This item's specs are already fully readable
			if (item.identified) {

				// no point in wanting items we cant equip
				if (item.getStat(sdk.stats.Levelreq) > this.reference.getStat(sdk.stats.Level) || item.dexreq > this.reference.getStat(sdk.stats.Dexterity) || item.strreq > this.reference.getStat(sdk.stats.Strength)) {
					return false;
				}

				//ToDo; check if the item is vendored, and if we can afford it

				if (currentItems.length) {
					let items = [item].concat(currentItems);

					// Compare the items. The highest rating is the best item, the lowest rating is the worst item
					// In case of multiple slots (e.g. rings), this tells us which ring we want to replace this ring with.
					let compared = this.compareRetAll(items);

					// we want item if it is better than the worst equipped for this slot
					return compared.indexOf(item) < compared.indexOf(currentItems.last());
				}
			}
			return !!item.getBodyLoc(); // for now, we want all items that we can equip
		}).call(this);
	};

	AutoEquip.prototype.handle = function (item) {
		let key = '__wanted__by_AutoEquip' + this.id;
		const dealWithIt = item => {
			item[key] = (() => {
				// console.debug('DEALING WITH IT -- ' + item.name + '. Tier ' + tier);
				// We got it now, but somehow... dont want it anymore?
				if (!this.want(item)) {
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

				const tier = this.formula(item);

				let bodyLocs = item.getBodyLoc();
				let currentSlots = bodyLocs.map(loc => ({
					location: loc, item: this.reference.getItemsEx()
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
						return this.compare(a.item, b.item) === a.item ? 1 : -1
					});

				// currentSlots sorted by formula ascending (index 0 is worse than index 1)
				let emptySlot = currentSlots.filter(s => !s.item).first();
				let old;
				if (emptySlot) {
					old = item.equip(emptySlot.location, this.reference);
				} else {
					for (let i = 0; i < currentSlots.length && !old; i++) {
						// if item is better than current, equip it
						if (this.compare(currentSlots[i].item, item) === item) {
							old = item.equip(currentSlots[i].location, this.reference);
						}
					}
				}

				// Sometimes it happens the OLD item seems better once we have the new one in place
				// Was the old item better?
				if (old && old.unequiped && old.unequiped.length) {
					const newTier = this.formula(old.unequiped.first());
					if (newTier > tier) {
						return !!old.rollback(); // Rollback and return
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
			let tome = /**@type Unit*/ me.findItem(519, 0, 3); // ToDo Use loose scrolls
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
	 * @return Item[]
	 */
	AutoEquip.prototype.shop = function (items) {
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
					const currentItem = (me.getItemsEx()||[])
						.filter(item => item.isEquipped && item.bodylocation === bodyloc)
						.first();

					const currentRating = !currentItem ? -Infinity : this.formula(currentItem);

					// calculate the actual rating of this item
					return items.map(item => {
						let ratingThisItem = this.formula(item);
						if (ratingThisItem < currentRating) return false;

						// Avoid issues like dual handed items and such
						if (!this.want(item)) return false;

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


	module.exports = AutoEquip;
	// Inject ourselfs into the pickit handlers
})(module, require);