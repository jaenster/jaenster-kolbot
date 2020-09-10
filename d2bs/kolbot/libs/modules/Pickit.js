/**
 *    @module    Pickit.js
 *    @author        kolton, jaenster
 *    @desc        handle item pickup
 */

(function (module, require) {
	const Storage = require('../modules/Storage'),
		NTIP = require('../modules/NTIP'),
		Misc = require('../modules/Misc'),
		Town = require('../modules/Town'),
		beltSize = Storage.BeltSize(),
		ignoreLog = [4, 5, 6, 22, 41, 76, 77, 78, 79, 80, 81]; // Ignored item types for item logging

	const Pather = require('../modules/Pather');

	/** @class Pickit*/
	const Pickit = function Pickit() {
	};

	// Returns:
	// -1 - Needs iding
	// 0 - Unwanted
	// 4 - Pickup to sell (triggered when low on gold)
	// "module_name" - If module module_name wants it
	Pickit.checkItem = function (unit) {
		const parent = unit.getParent();

		// Dont hook on vendorable items
		if (!parent || parent.gid !== getInteractedNPC().gid) {
			const wantedByHook = unit instanceof Unit && Pickit.hooks.find(hook => (typeof hook === 'function' || typeof hook === 'object') && hook.hasOwnProperty('want') && hook.want(unit));

			let hookResult, i = 0, hook;
			for (let l = Pickit.hooks.length; i < l && !hookResult; i++) {
				hook = Pickit.hooks[i];
				if (hook && (typeof hook === 'function' || typeof hook === 'object')) {
					hookResult = hook.hasOwnProperty('want') && hook.want(unit);
				}
			}

			if (wantedByHook) { // If wanted by a hook
				return { // Hook wants to identify the item?
					result: hookResult === -1 ? -1 : hook.id,
					line: hook.id,
					hook: hook,
				}
			}
		}

		const rval = NTIP.CheckItem(unit, false, true);

		// If total gold is less than 10k pick up anything worth 10 gold per
		// square to sell in town.
		if (rval.result === 0 && Town.ignoredItemTypes.indexOf(unit.itemType) === -1 && me.gold < Config.LowGold && unit.itemType !== 39) {
			// Gold doesn't take up room, just pick it up
			if (unit.classid === 523 && unit.distance < 5) {
				return {
					result: 4,
					line: null
				};
			}

			if (unit.getItemCost(1) / (unit.sizex * unit.sizey) >= 10) {
				return {
					result: 4,
					line: null
				};
			}
		}

		return rval;
	};

	Pickit.pickItems = function () {
		var status, item, canFit,
			needMule = false,
			pickList = [];

		Town.clearBelt();

		if (me.dead) {
			return false;
		}

		while (!me.idle) {
			delay(40);
		}

		item = getUnit(4);

		if (item) {
			do {
				if ((item.mode === 3 || item.mode === 5) && getDistance(me, item) <= Config.PickRange) {
					pickList.push(copyUnit(item));
				}
			} while (item.getNext());
		}
		while (pickList.length > 0) {
			if (me.dead) {
				return false;
			}

			pickList.sort(this.sortItems);

			// Check if the item unit is still valid and if it's on ground or being dropped
			if (copyUnit(pickList[0]).x !== undefined && (pickList[0].mode === 3 || pickList[0].mode === 5) &&
				(Pather.useTeleport() || me.inTown || !checkCollision(me, pickList[0], 0x1))) { // Don't pick items behind walls/obstacles when walking
				// Check if the item should be picked
				status = this.checkItem(pickList[0]);
				if (status.result && this.canPick(pickList[0])) {
					// Override canFit for scrolls, potions and gold
					canFit = Storage.Inventory.CanFit(pickList[0]) || [4, 22, 76, 77, 78].indexOf(pickList[0].itemType) > -1;

					// Try to make room with FieldID
					if (!canFit && Config.FieldID && Town.fieldID()) {
						canFit = Storage.Inventory.CanFit(pickList[0]) || [4, 22, 76, 77, 78].indexOf(pickList[0].itemType) > -1;
					}

					// Try to make room by selling items in town
					if (!canFit) {
						// Check if any of the current inventory items can be stashed or need to be identified and eventually sold to make room
						if (this.canMakeRoom()) {
							print("ÿc7Trying to make room for " + this.itemColor(pickList[0]) + pickList[0].name);

							if (Config.FieldID) {
								// We id in the field
								Town.fieldID();
								continue; // Re do the loop
							} else {

								// Go to town and do town chores
								if (Town.visitTown()) {
									// Recursive check after going to town. We need to remake item list because gids can change.
									// Called only if room can be made so it shouldn't error out or block anything.

									return this.pickItems();
								}
							}

							// Town visit failed - abort
							print("ÿc7Not enough room for " + this.itemColor(pickList[0]) + pickList[0].name);

							return false;
						}
					}

					// Item can fit - pick it up
					if (canFit) {
						this.pickItem(pickList[0], status.result, status.line);
					}
				}
			}

			pickList.shift();
		}

		return true;
	};

	// Check if we can even free up the inventory
	Pickit.canMakeRoom = function () {
		if (!Config.MakeRoom) {
			return false;
		}
		var i,
			items = Storage.Inventory.Compare(Config.Inventory);

		if (items) {
			for (i = 0; i < items.length; i += 1) {
				const item = items[i];

				//ToDo; what if you got multiple books?
				if (item.itemType === 18) {
					// Dont throw a book
					let otherBook = (me.getItems() || []).filter(el => el.classid === item.classid).first();

					// the _first_ book of a kind we keep[
					if (otherBook.gid === item.gid) continue;
				}

				const result = this.checkItem(item).result;
				const hook = Pickit.hooks.find(hook => result === hook.id);
				if (hook) {
					const uniqueId = item.uniqueId;
					hook.handle(item);
					if (uniqueId !== item.uniqueId) {
						// If something changed on the item, it means we did something with it

						// If its still in inventory, lets rerun the entire loop again with the item
						if (item.location === sdk.storage.Inventory) {
							i--; // put it back in the array
							continue; // re-loop and restore process
						}
					} else {
						i--; // put it back in the array
						continue; // re-loop and restore process
					}
				}
				switch (result) {
					case -1: // Item needs to be identified
						// For low level chars that can't actually get id scrolls -> prevent an infinite loop
						if (me.getStat(14) + me.getStat(15) < 100) {
							return false;
						}

						return true;
					case 0:
						item.drop();
						return true;
						break;
					default: // Check if a kept item can be stashed
						if (Town.canStash(items[i])) {
							return true;
						}

						break;
				}
			}
		}

		return false;
	};

	Pickit.useTK = (unit, _self) => me.classid === 1 && me.getSkill(43, 1) && (_self.type === 4 || _self.type === 22 || (_self.type > 75 && _self.type < 82)) &&
		unit.distance > 5 && unit.distance < 20 && !checkCollision(me, unit, 0x4);

	Pickit.pickItem = function (unit, status, keptLine) {
		function ItemStats(unit) {
			this.ilvl = unit.ilvl;
			this.type = unit.itemType;
			this.classid = unit.classid;
			this.name = unit.name;
			this.color = Pickit.itemColor(unit);
			this.gold = unit.getStat(14);
			this.useTk = Pickit.useTK(unit, this);
			this.picked = false;
		}

		let i, item, tick, gid, stats,
			cancelFlags = [0x01, 0x08, 0x14, 0x0c, 0x19, 0x1a],
			itemCount = me.itemcount;

		if (unit.gid) {
			gid = unit.gid;
			item = getUnit(4, -1, -1, gid);
		}

		if (!item) {
			return false;
		}

		while (cancelFlags.some(x => getUIFlag(x) && (me.cancel(0) || true))) delay(50);

		stats = new ItemStats(item);

		MainLoop:
			for (i = 0; i < 3; i += 1) {
				if (!getUnit(4, -1, -1, gid)) {
					break;
				}

				if (me.dead) {
					return false;
				}

				while (!me.idle) {
					delay(40);
				}

				if (item.mode !== 3 && item.mode !== 5) {
					break;
				}

				if (stats.useTk && checkCollision(me, item, 0x1)) { // Cant tk trough a wall
					item.cast(43);
				} else {
					if (getDistance(me, item) > 6 || checkCollision(me, item, 0x1)) {
						if (Pather.useTeleport()) {
							Pather.moveToUnit(item);
						} else if (!Pather.moveTo(item.x, item.y, 0)) {
							continue;
						}
					}

					// "click" the item
					sendPacket(1, 0x16, 4, 0x4, 4, item.gid, 4, 0);
				}

				tick = getTickCount();

				while (getTickCount() - tick < 1000) {
					item = copyUnit(item);

					if (stats.classid === 523) {
						if (!item.getStat(14) || item.getStat(14) < stats.gold) {
							console.debug(status, keptLine);
							print("ÿc7Picked up " + stats.color + (item.getStat(14) ? (item.getStat(14) - stats.gold) : stats.gold) + " " + stats.name);

							return true;
						}
					}

					if (item.mode !== 3 && item.mode !== 5) {
						switch (stats.classid) {
							case 543: // Key
								print("ÿc7Picked up " + stats.color + stats.name + " ÿc7(" + Town.checkKeys() + "/12)");

								return true;
							case 529: // Scroll of Town Portal
							case 530: // Scroll of Identify
								print("ÿc7Picked up " + stats.color + stats.name + " ÿc7(" + Town.checkScrolls(stats.classid === 529 ? "tbk" : "ibk") + "/20)");

								return true;
						}

						break MainLoop;
					}

					delay(20);
				}

				// TK failed, disable it
				stats.useTk = false;

				//print("pick retry");
			}

		stats.picked = me.itemcount > itemCount || !!me.getItem(-1, -1, gid);

		if (stats.picked) {
			DataFile.updateStats("lastArea");
			let module;

			if (status === 1) {
				print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + (keptLine ? ") (" + keptLine + ")" : ")"));

				if (ignoreLog.indexOf(stats.type) === -1) {
					Misc.itemLogger("Kept", item);
					Misc.logItem("Kept", item, keptLine);
				}
			} else if ((module = Pickit.hooks.find(x => x.id === status))) {
				print("ÿc7Picked for (ÿc0" + module.id + 'ÿc7) - ' + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + (keptLine ? ") (" + keptLine + ")" : ")"));
				module.handle(item);
			} else {
				print("ÿc7Picked up " + stats.color + stats.name + " ÿc0(ilvl " + stats.ilvl + (keptLine ? ") (" + keptLine + ")" : ")"));

			}
		}

		return true;
	};

	Pickit.itemQualityToName = function (quality) {
		var qualNames = ["", "lowquality", "normal", "superior", "magic", "set", "rare", "unique", "crafted"];

		return qualNames[quality];
	};

	Pickit.itemColor = function (unit, type) {
		if (type === undefined) {
			type = true;
		}

		if (type) {
			switch (unit.itemType) {
				case 4: // gold
					return "ÿc4";
				case 74: // runes
					return "ÿc8";
				case 76: // healing potions
					return "ÿc1";
				case 77: // mana potions
					return "ÿc3";
				case 78: // juvs
					return "ÿc;";
			}
		}

		switch (unit.quality) {
			case 4: // magic
				return "ÿc3";
			case 5: // set
				return "ÿc2";
			case 6: // rare
				return "ÿc9";
			case 7: // unique
				return "ÿc4";
			case 8: // crafted
				return "ÿc8";
		}

		return "ÿc0";
	};

	Pickit.canPick = function (unit) {
		var tome, charm, i, potion, needPots, buffers, pottype, myKey, key;
		switch (unit.classid) {
			case 92: // Staff of Kings
			case 173: // Khalim's Flail
			case 521: // Viper Amulet
			case 546: // Jade Figurine
			case 549: // Cube
			case 551: // Mephisto's Soulstone
			case 552: // Book of Skill
			case 553: // Khalim's Eye
			case 554: // Khalim's Heart
			case 555: // Khalim's Brain
				if (me.getItem(unit.classid)) {
					return false;
				}

				break;
		}

		switch (unit.itemType) {
			case 4: // Gold
				if (me.getStat(14) === me.getStat(12) * 10000) { // Check current gold vs max capacity (cLvl*10000)
					return false; // Skip gold if full
				}

				break;
			case 22: // Scroll
				tome = me.getItem(unit.classid - 11, 0); // 518 - Tome of Town Portal or 519 - Tome of Identify, mode 0 - inventory/stash

				if (tome) {
					do {
						if (tome.location === 3 && tome.getStat(70) === 20) { // In inventory, contains 20 scrolls
							return false; // Skip a scroll if its tome is full
						}
					} while (tome.getNext());
				} else {
					return false; // Don't pick scrolls if there's no tome
				}

				break;
			case 41: // Key (new 26.1.2013)
				if (me.classid === 6) { // Assassins don't ever need keys
					return false;
				}

				myKey = me.getItem(543, 0);
				key = getUnit(4, -1, -1, unit.gid); // Passed argument isn't an actual unit, we need to get it

				if (myKey && key) {
					do {
						if (myKey.location === 3 && myKey.getStat(70) + key.getStat(70) > 12) {
							return false;
						}
					} while (myKey.getNext());
				}

				break;
			case 82: // Small Charm
			case 83: // Large Charm
			case 84: // Grand Charm
				if (unit.quality === 7) { // Unique
					charm = me.getItem(unit.classid, 0);

					if (charm) {
						do {
							if (charm.quality === 7) {
								return false; // Skip Gheed's Fortune, Hellfire Torch or Annihilus if we already have one
							}
						} while (charm.getNext());
					}
				}

				break;
			case 76: // Healing Potion
			case 77: // Mana Potion
			case 78: // Rejuvenation Potion
				needPots = 0;

				for (i = 0; i < 4; i += 1) {
					if (typeof unit.code === "string" && unit.code.indexOf(Config.BeltColumn[i]) > -1) {
						needPots += beltSize;
					}
				}

				potion = me.getItem(-1, 2);

				if (potion) {
					do {
						if (potion.itemType === unit.itemType) {
							needPots -= 1;
						}
					} while (potion.getNext());
				}

				if (needPots < 1 && this.checkBelt()) {
					buffers = ["HPBuffer", "MPBuffer", "RejuvBuffer"];

					for (i = 0; i < buffers.length; i += 1) {
						if (Config[buffers[i]]) {
							switch (buffers[i]) {
								case "HPBuffer":
									pottype = 76;

									break;
								case "MPBuffer":
									pottype = 77;

									break;
								case "RejuvBuffer":
									pottype = 78;

									break;
							}

							if (unit.itemType === pottype) {
								if (!Storage.Inventory.CanFit(unit)) {
									return false;
								}

								needPots = Config[buffers[i]];
								potion = me.getItem(-1, 0);

								if (potion) {
									do {
										if (potion.itemType === pottype && potion.location === 3) {
											needPots -= 1;
										}
									} while (potion.getNext());
								}
							}
						}
					}
				}

				if (needPots < 1) {
					potion = me.getItem();

					if (potion) {
						do {
							if (potion.itemType === unit.itemType && ((potion.mode === 0 && potion.location === 3) || potion.mode === 2)) {
								if (potion.classid < unit.classid) {
									potion.interact();
									needPots += 1;

									break;
								}
							}
						} while (potion.getNext());
					}
				}

				if (needPots < 1) {
					return false;
				}

				break;
			case undefined: // Yes, it does happen
				print("undefined item (!?)");

				return false;
		}

		return true;
	};

	Pickit.checkBelt = function () {
		var check = 0,
			item = me.getItem(-1, 2);

		if (item) {
			do {
				if (item.x < 4) {
					check += 1;
				}
			} while (item.getNext());
		}

		return check === 4;
	};

	// Just sort by distance for general item pickup
	Pickit.sortItems = (a, b) => a.distance - b.distance;

	Pickit.LoadFiles = (files) => files.forEach(file => NTIP.OpenFile("pickit/" + file, getScript(true).name.toLowerCase().split('').reverse().splice(0, '.dbj'.length).reverse().join('') === '.dbj'));

	Pickit.hooks = []; // You can hook upon the pickit module
	module.exports = Pickit;
})(module, require);