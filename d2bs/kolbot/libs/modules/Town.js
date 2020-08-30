/**
 *    @filename    Town.js
 *    @author      kolton, Jaenster
 *    @desc        do town chores like buying, selling and gambling
 */
(function (module, require) {
	const NPC = require('./NPC');
	const Packet = require('./PacketHelpers');
	const Misc = require('./Misc');
	const Pather = require('./Pather');
	let sellTimer = getTickCount();  // shop speedup test
	let gambleIds = [];

	const tasks = [
		{
			Heal: NPC.Akara,
			Shop: NPC.Akara,
			Gamble: NPC.Gheed,
			Repair: NPC.Charsi,
			Merc: NPC.Kashya,
			Key: NPC.Akara,
			CainID: NPC.Cain
		},
		{
			Heal: NPC.Fara,
			Shop: NPC.Drognan,
			Gamble: NPC.Elzix,
			Repair: NPC.Fara,
			Merc: NPC.Greiz,
			Key: NPC.Lysander,
			CainID: NPC.Cain
		},
		{
			Heal: NPC.Ormus,
			Shop: NPC.Ormus,
			Gamble: NPC.Alkor,
			Repair: NPC.Hratli,
			Merc: NPC.Asheara,
			Key: NPC.Hratli,
			CainID: NPC.Cain
		},
		{
			Heal: NPC.Jamella,
			Shop: NPC.Jamella,
			Gamble: NPC.Jamella,
			Repair: NPC.Halbu,
			Merc: NPC.Tyrael,
			Key: NPC.Jamella,
			CainID: NPC.Cain
		},
		{
			Heal: NPC.Malah,
			Shop: NPC.Malah,
			Gamble: NPC.Anya,
			Repair: NPC.Larzuk,
			Merc: NPC.Qual_Kehk,
			Key: NPC.Malah,
			CainID: NPC.Cain
		}
	];

	const Town = function Town(repair = false) {
		if (!me.inTown) {
			Town.goToTown();
		}

		let i, cancelFlags = [0x01, 0x02, 0x04, 0x08, 0x14, 0x16, 0x0c, 0x0f, 0x19, 0x1a];

		me.switchWeapons(me.primarySlot);

		Town.heal();
		Town.identify();
		Town.shopItems();
		Town.fillTome(518);

		if (Config.FieldID) {
			Town.fillTome(519);
		}

		Town.buyPotions();
		Town.clearInventory();
		Town.buyKeys();
		Town.repair(repair);
		Town.gamble();
		Town.reviveMerc();
		Town.stash(true);
		Town.clearScrolls();

		for (i = 0; i < cancelFlags.length; i += 1) {
			if (getUIFlag(cancelFlags[i])) {
				delay(500);
				me.cancel();

				break;
			}
		}

		me.cancel();

		return true;
	};


	Town.checkQuestItems = function () {
		var i, npc, item;

		// golden bird stuff
		if (me.getItem(546)) {
			Town.goToTown(3);
			Town.move(NPC.Meshif);

			npc = getUnit(1, NPC.Meshif);

			if (npc) {
				npc.openMenu();
				me.cancel();
			}
		}

		if (me.getItem(547)) {
			Town.goToTown(3);
			Town.move(NPC.Alkor);

			npc = getUnit(1, NPC.Alkor);

			if (npc) {
				for (i = 0; i < 2; i += 1) {
					npc.openMenu();
					me.cancel();
				}
			}
		}

		if (me.getItem(545)) {
			item = me.getItem(545);

			if (item.location > 3) {
				Town.openStash();
			}

			item.interact();
		}
	};

	// Start a task and return the NPC Unit
	Town.initNPC = function (task, reason) {
		print("initNPC: " + reason);

		var npc = getInteractedNPC();

		if (npc && npc.name.toLowerCase() !== tasks[me.act - 1][task]) {
			me.cancel();

			npc = null;
		}

		// Jamella gamble fix
		if (task === "Gamble" && npc && npc.name.toLowerCase() === NPC.Jamella) {
			me.cancel();

			npc = null;
		}

		if (!npc) {
			npc = getUnit(1, tasks[me.act - 1][task]);

			if (!npc) {
				Town.move(tasks[me.act - 1][task]);

				npc = getUnit(1, tasks[me.act - 1][task]);
			}
		}

		if (!npc || npc.area !== me.area || (!getUIFlag(0x08) && !npc.openMenu())) {
			return false;
		}

		switch (task) {
			case "Shop":
			case "Repair":
			case "Gamble":
				if (!getUIFlag(0x0C) && !npc.startTrade(task)) {
					return false;
				}

				break;
			case "Key":
				if (!getUIFlag(0x0C) && !npc.startTrade(me.act === 3 ? "Repair" : "Shop")) {
					return false;
				}

				break;
			case "CainID":
				Misc.useMenu(0x0FB4);
				me.cancel();

				break;
		}

		return npc;
	};

	// Go to a town healer
	Town.heal = function () {
		if (!Town.needHealing()) {
			return true;
		}

		if (!Town.initNPC("Heal", "heal")) {
			return false;
		}

		return true;
	};

	// Check if healing is needed, based on character config
	Town.needHealing = function () {
		if (me.hp * 100 / me.hpmax <= Config.HealHP || me.mp * 100 / me.mpmax <= Config.HealMP) {
			return true;
		}

		// Status effects
		if (Config.HealStatus && (me.getState(2) || me.getState(9) || me.getState(61))) {
			return true;
		}

		return false;
	};

	Town.buyPotions = function () {
		if (me.gold < 1000) { // Ain't got money fo' dat shyt
			return false;
		}

		var i, j, npc, useShift, col, beltSize, pot,
			needPots = false,
			needBuffer = true,
			buffer = {
				hp: 0,
				mp: 0
			};
		const Storage = require('./Storage');
		beltSize = Storage.BeltSize();
		col = Town.checkColumns(beltSize);

		// HP/MP Buffer
		if (Config.HPBuffer > 0 || Config.MPBuffer > 0) {
			pot = me.getItem(-1, 0);

			if (pot) {
				do {
					if (pot.location === 3) {
						switch (pot.itemType) {
							case 76:
								buffer.hp += 1;

								break;
							case 77:
								buffer.mp += 1;

								break;
						}
					}
				} while (pot.getNext());
			}
		}

		// Check if we need to buy potions based on Config.MinColumn
		for (i = 0; i < 4; i += 1) {
			if (["hp", "mp"].indexOf(Config.BeltColumn[i]) > -1 && col[i] > (beltSize - Math.min(Config.MinColumn[i], beltSize))) {
				needPots = true;
			}
		}

		// Check if we need any potions for buffers
		if (buffer.mp < Config.MPBuffer || buffer.hp < Config.HPBuffer) {
			for (i = 0; i < 4; i += 1) {
				// We can't buy potions because they would go into belt instead
				if (col[i] >= beltSize && (!needPots || Config.BeltColumn[i] === "rv")) {
					needBuffer = false;

					break;
				}
			}
		}

		// We have enough potions in inventory
		if (buffer.mp >= Config.MPBuffer && buffer.hp >= Config.HPBuffer) {
			needBuffer = false;
		}

		// No columns to fill
		if (!needPots && !needBuffer) {
			return true;
		}

		if (me.diff === 0 && Pather.accessToAct(4) && me.act < 4) {
			Town.goToTown(4);
		}

		npc = Town.initNPC("Shop", "buyPotions");

		if (!npc) {
			return false;
		}

		for (i = 0; i < 4; i += 1) {
			if (col[i] > 0) {
				useShift = Town.shiftCheck(col, beltSize);
				pot = Town.getPotion(npc, Config.BeltColumn[i]);

				if (pot) {
					//print("ÿc2column ÿc0" + i + "ÿc2 needs ÿc0" + col[i] + " ÿc2potions");

					// Shift+buy will trigger if there's no empty columns or if only the current column is empty
					if (useShift) {
						pot.buy(true);
					} else {
						for (j = 0; j < col[i]; j += 1) {
							pot.buy(false);
						}
					}
				}
			}

			col = Town.checkColumns(beltSize); // Re-initialize columns (needed because 1 shift-buy can fill multiple columns)
		}

		if (needBuffer && buffer.hp < Config.HPBuffer) {
			for (i = 0; i < Config.HPBuffer - buffer.hp; i += 1) {
				pot = Town.getPotion(npc, "hp");

				if (Storage.Inventory.CanFit(pot)) {
					pot.buy(false);
				}
			}
		}

		if (needBuffer && buffer.mp < Config.MPBuffer) {
			for (i = 0; i < Config.MPBuffer - buffer.mp; i += 1) {
				pot = Town.getPotion(npc, "mp");

				if (Storage.Inventory.CanFit(pot)) {
					pot.buy(false);
				}
			}
		}

		return true;
	};

	// Purchases and drinks potions in town.
	Town.stackPotions = function (type, amount) {
		if (!amount) amount = 4; // TODO: Calculate monster effort and correlate it to the number of potions to stack.
		if (me.gold < amount * 25) {
			print('stackPotions: Not enough gold for ' + amount + ' potions');
			return false;
		}
		const npc = Town.initNPC("Shop", "buyPotions");
		for (let i = 0; i < amount; i++) {
			const npcPotion = Town.getPotion(npc, type);
			if (npcPotion) {
				npcPotion.buy(false);
			}
		}
		me.getItems(npcPotion.classid)
			.filter(potion => (potion.classid == npcPotion.classid && (potion.mode === sdk.itemmode.inBelt || potion.location === sdk.storage.Inventory)))
			.every((potion, index) => {
				if (index >= amount) return false; // Only drink n (amount) potions.
				me.overhead('Stacking potion (' + (index + 1) + '/' + amount + ')');
				potion.interact();
				return true;
			});
		return true;
	};

	// Check when to shift-buy potions
	Town.shiftCheck = function (col, beltSize) {
		var i, fillType;

		for (i = 0; i < col.length; i += 1) {
			// Set type based on non-empty column
			if (!fillType && col[i] > 0 && col[i] < beltSize) {
				fillType = Config.BeltColumn[i];
			}

			if (col[i] >= beltSize) {
				switch (Config.BeltColumn[i]) {
					case "hp":
						// Set type based on empty column
						if (!fillType) {
							fillType = "hp";
						}

						// Can't shift+buy if we need to get differnt potion types
						if (fillType !== "hp") {
							return false;
						}

						break;
					case "mp":
						if (!fillType) {
							fillType = "mp";
						}

						if (fillType !== "mp") {
							return false;
						}

						break;
					case "rv": // Empty rejuv column = can't shift-buy
						return false;
				}
			}
		}

		return true;
	};

	// Return column status (needed potions in each column)
	Town.checkColumns = function (beltSize) {
		var col = [beltSize, beltSize, beltSize, beltSize],
			pot = me.getItem(-1, 2); // Mode 2 = in belt

		if (!pot) { // No potions
			return col;
		}

		do {
			col[pot.x % 4] -= 1;
		} while (pot.getNext());

		return col;
	};

	// Get the highest potion from current npc
	Town.getPotion = function (npc, type) {
		var i, result;

		if (!type) {
			return false;
		}

		if (type === "hp" || type === "mp") {
			for (i = 5; i > 0; i -= 1) {
				result = npc.getItem(type + i);

				if (result) {
					return result;
				}
			}
		} else if (type === "yps" || type === "vps" || type === "wms") {
			for (i = 5; i > 0; i -= 1) {
				result = npc.getItem(type);

				if (result) {
					return result;
				}
			}
		}

		return false;
	};

	Town.fillTome = function (code) {
		if (me.gold < 450) {
			return false;
		}

		if (Town.checkScrolls(code) >= 13) {
			return true;
		}

		var scroll, tome,
			npc = Town.initNPC("Shop", "fillTome");

		if (!npc) {
			return false;
		}

		delay(500);
		const Storage = require('./Storage');
		if (code === 518 && !me.findItem(518, 0, 3)) {
			tome = npc.getItem(518);

			if (tome && Storage.Inventory.CanFit(tome)) {
				try {
					tome.buy();
				} catch (e1) {
					print(e1);

					// Couldn't buy the tome, don't spam the scrolls
					return false;
				}
			} else {
				return false;
			}
		}

		scroll = npc.getItem(code === 518 ? 529 : 530);

		if (!scroll) {
			return false;
		}

		try {
			scroll.buy(true);
		} catch (e2) {
			print(e2.message);

			return false;
		}

		return true;
	};

	Town.checkScrolls = function (id) {
		var tome = me.findItem(id, 0, 3);

		if (!tome) {
			switch (id) {
				case 519:
				case "ibk":
					return 20; // Ignore missing ID tome
				case 518:
				case "tbk":
					return 0; // Force TP tome check
			}
		}

		return tome.getStat(70);
	};

	Town.identify = function () {
		var i, item, tome, scroll, npc, list, timer, tpTome,
			tpTomePos = {};

		const Pickit = require('./Pickit');
		Town.cainID();
		const Storage = require('./Storage');
		list = Storage.Inventory.Compare(Config.Inventory);

		if (!list) {
			console.debug('here?');
			return false;
		}

		console.debug('avoid unnecessary NPC visits');
		// Avoid unnecessary NPC visits
		for (i = 0; i < list.length; i += 1) {
			// Only unid items or sellable junk (low level) should trigger a NPC visit
			if ((!list[i].getFlag(0x10) || Config.LowGold > 0) && ([-1, 4].indexOf(Pickit.checkItem(list[i]).result) > -1 || (!list[i].getFlag(0x10)))) {
				break;
			}
		}

		if (i === list.length) {
			return false;
		}

		npc = Town.initNPC("Shop", "identify");

		if (!npc) {
			return false;
		}

		tome = me.findItem(519, 0, 3);

		if (tome && tome.getStat(70) < list.length) {
			Town.fillTome(519);
		}
		MainLoop:
			while (list.length > 0) {
				item = list.shift();

				if (!item.getFlag(0x10) && item.location === 3 && ignoredItemTypes.indexOf(item.itemType) === -1) {
					let result = Pickit.checkItem(item);

					const hook = Pickit.hooks.find(hook => result.result === hook.id);
					if (hook) {
						const uniqueId = item.uniqueId;
						hook.handle(item);
						if (uniqueId !== item.uniqueId) {
							// If something changed on the item, it means we did something with it

							// If its still in inventory, lets rerun the entire loop again with the item
							if (item.location === sdk.storage.Inventory) {
								list.unshift(item); // put it back in the array
								continue; // re-loop and restore process
							}
						}
					}

					switch (result.result) {
						// Items for gold, will sell magics, etc. w/o id, but at low levels
						// magics are often not worth iding.
						case 4:
							Misc.itemLogger("Sold", item);
							item.sell();

							break;
						case -1:
							if (tome) {
								Town.identifyItem(item, tome);
							} else {
								scroll = npc.getItem(530);

								if (scroll) {
									if (!Storage.Inventory.CanFit(scroll)) {
										tpTome = me.findItem(518, 0, 3);

										if (tpTome) {
											tpTomePos = {x: tpTome.x, y: tpTome.y};

											tpTome.sell();
											delay(500);
										}
									}

									delay(500);

									if (Storage.Inventory.CanFit(scroll)) {
										scroll.buy();
									}
								}

								scroll = me.findItem(530, 0, 3);

								if (!scroll) {
									break MainLoop;
								}

								Town.identifyItem(item, scroll);
							}

							result = Pickit.checkItem(item);

							switch (result.result) {
								case 1:
									// Couldn't id autoEquip item. Don't log it.
									if (result.result === 1 && Config.AutoEquip && !item.getFlag(0x10)) {
										break;
									}

									Misc.itemLogger("Kept", item);
									Misc.logItem("Kept", item, result.line);

									break;
								case -1: // unidentified
									break;
								default:
									Misc.itemLogger("Sold", item);
									item.sell();

									timer = getTickCount() - sellTimer; // shop speedup test

									if (timer > 0 && timer < 500) {
										delay(timer);
									}

									break;
							}

							break;
					}
				}
			}

		Town.fillTome(518); // Check for TP tome in case it got sold for ID scrolls

		return true;
	};

	Town.cainID = function () {
		if (!Config.CainID.Enable) {
			return false;
		}
		const Pickit = require('./Pickit');

		// Check if we're already in a shop. It would be pointless to go to Cain if so.
		var i, cain, unids, result,
			npc = getInteractedNPC();

		if (npc && npc.name.toLowerCase() === tasks[me.act - 1].Shop) {
			return false;
		}

		// Check if we may use Cain - minimum gold
		if (me.gold < Config.CainID.MinGold) {
			//print("Can't use Cain - not enough gold.");

			return false;
		}

		me.cancel();
		Town.stash(false);

		unids = Town.getUnids();

		if (unids) {
			// Check if we may use Cain - number of unid items
			if (unids.length < Config.CainID.MinUnids) {
				//print("Can't use Cain - not enough unid items.");

				return false;
			}

			// Check if we may use Cain - kept unid items
			for (i = 0; i < unids.length; i += 1) {
				if (Pickit.checkItem(unids[i]).result > 0) {
					//print("Can't use Cain - can't id a valid item.");

					return false;
				}
			}

			cain = Town.initNPC("CainID", "cainID");

			if (!cain) {
				return false;
			}

			for (i = 0; i < unids.length; i += 1) {
				result = Pickit.checkItem(unids[i]);

				switch (result.result) {
					case 0:
						Misc.itemLogger("Dropped", unids[i], "cainID");
						unids[i].drop();

						break;
					case 1:
						Misc.itemLogger("Kept", unids[i]);
						Misc.logItem("Kept", unids[i], result.line);

						break;
					default:
						break;
				}
			}
		}

		return true;
	};

	Town.fieldID = function () { // not exactly a town function but whateva
		var list, tome, item, result;

		list = Town.getUnids();
		const Pickit = require('./Pickit');
		if (!list) {
			return false;
		}

		tome = me.findItem(519, 0, 3);

		if (!tome || tome.getStat(70) < list.length) {
			return false;
		}

		while (list.length > 0) {
			item = list.shift();
			result = Pickit.checkItem(item);

			// Force ID for unid items matching autoEquip criteria
			if (result.result === 1 && !item.getFlag(0x10)) {
				result.result = -1;
			}

			if (result.result === -1) { // unid item that should be identified
				Town.identifyItem(item, tome);
				delay(me.ping + 1);

				result = Pickit.checkItem(item);

				switch (result.result) {
					case 0:
						Misc.itemLogger("Dropped", item, "fieldID");

						if (Config.DroppedItemsAnnounce.Enable && Config.DroppedItemsAnnounce.Quality.indexOf(item.quality) > -1) {
							say("Dropped: [" + Pickit.itemQualityToName(item.quality).charAt(0).toUpperCase() + Pickit.itemQualityToName(item.quality).slice(1) + "] " + item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "").trim());

							if (Config.DroppedItemsAnnounce.LogToOOG && Config.DroppedItemsAnnounce.OOGQuality.indexOf(item.quality) > -1) {
								Misc.logItem("Field Dropped", item, result.line);
							}
						}

						item.drop();

						break;
					case 1:
						Misc.itemLogger("Field Kept", item);
						Misc.logItem("Field Kept", item, result.line);

						break;
					default:
						break;
				}
			}
		}

		delay(200);
		me.cancel();

		return true;
	};

	Town.getUnids = function () {
		var list = [],
			item = me.getItem(-1, 0);

		if (!item) {
			return false;
		}

		do {
			if (item.location === 3 && !item.getFlag(0x10)) {
				list.push(copyUnit(item));
			}
		} while (item.getNext());

		if (!list.length) {
			return false;
		}

		return list;
	};

	Town.identifyItem = function (unit, tome) {
		if (Config.PacketShopping) {
			return Packet.identifyItem(unit, tome);
		}

		var i, tick;

		if (!unit || unit.getFlag(0x10)) {
			return false;
		}

		sellTimer = getTickCount(); // shop speedup test

		CursorLoop:
			for (i = 0; i < 3; i += 1) {
				clickItem(1, tome);

				tick = getTickCount();

				while (getTickCount() - tick < 500) {
					if (getCursorType() === 6) {
						break CursorLoop;
					}

					delay(10);
				}
			}

		if (getCursorType() !== 6) {
			return false;
		}

		delay(270);

		for (i = 0; i < 3; i += 1) {
			if (getCursorType() === 6) {
				clickItem(0, unit);
			}

			tick = getTickCount();

			while (getTickCount() - tick < 500) {
				if (unit.getFlag(0x10)) {
					delay(50);

					return true;
				}

				delay(10);
			}

			delay(300);
		}

		return false;
	};

	Town.shopItems = function () {
		if (!Config.MiniShopBot) {
			return true;
		}
		const Pickit = require('./Pickit');

		let i, item, result,
			items = [],
			npc = getInteractedNPC();

		if (!npc || !npc.itemcount) {
			return false;
		}

		item = npc.getItem();

		if (!item) {
			return false;
		}

		const Storage = require('./Storage');
		print("ÿc4MiniShopBotÿc0: Scanning " + npc.itemcount + " items.");

		do {
			if (ignoredItemTypes.indexOf(item.itemType) === -1) {
				items.push(copyUnit(item));
			}
		} while (item.getNext());

		for (i = 0; i < items.length; i += 1) {
			result = Pickit.checkItem(items[i]);

			// if result is a string, its a pickit hook that wants to buy the item
			if (result.result === 1 || typeof result.result === 'string') {
				try {
					if (Storage.Inventory.CanFit(items[i]) && me.getStat(14) + me.getStat(15) >= items[i].getItemCost(0)) {
						Misc.itemLogger("Shopped", items[i]);
						Misc.logItem("Shopped", items[i], result.line);
						items[i].buy();
						if (typeof result.result === 'string') {
							const hook = Pickit.hooks.find(el => el.name === result.result);
							if (hook) hook.handle(item);
						}
					}
				} catch (e) {
					print(e);
				}
			}

			delay(2);
		}

		return true;
	};

	Town.gamble = function () {
		if (!Town.needGamble() || Config.GambleItems.length === 0) {
			return true;
		}
		const Pickit = require('./Pickit');

		var i, item, items, npc, newItem, result,
			list = [];

		if (gambleIds.length === 0) {
			// change text to classid
			for (i = 0; i < Config.GambleItems.length; i += 1) {
				if (isNaN(Config.GambleItems[i])) {
					if (NTIPAliasClassID.hasOwnProperty(Config.GambleItems[i].replace(/\s+/g, "").toLowerCase())) {
						gambleIds.push(NTIPAliasClassID[Config.GambleItems[i].replace(/\s+/g, "").toLowerCase()]);
					} else {
						Misc.errorReport("ÿc1Invalid gamble entry:ÿc0 " + Config.GambleItems[i]);
					}
				} else {
					gambleIds.push(Config.GambleItems[i]);
				}
			}
		}

		if (gambleIds.length === 0) {
			return true;
		}

		// Fuck Alkor
		if (me.act === 3) {
			Town.goToTown(2);
		}

		npc = Town.initNPC("Gamble", "gamble");

		if (!npc) {
			return false;
		}

		items = me.findItems(-1, 0, 3);

		while (items && items.length > 0) {
			list.push(items.shift().gid);
		}
		const Storage = require('./Storage');
		while (me.gold >= Config.GambleGoldStop) {
			if (!getInteractedNPC()) {
				npc.startTrade("Gamble");
			}

			item = npc.getItem();
			items = [];

			if (item) {
				do {
					if (gambleIds.indexOf(item.classid) > -1) {
						items.push(copyUnit(item));
					}
				} while (item.getNext());

				for (i = 0; i < items.length; i += 1) {
					if (!Storage.Inventory.CanFit(items[i])) {
						return false;
					}

					me.overhead("Buy: " + items[i].name);
					items[i].buy(false, true);

					newItem = Town.getGambledItem(list);

					if (newItem) {
						result = Pickit.checkItem(newItem);

						switch (result.result) {
							case 1:
								Misc.itemLogger("Gambled", newItem);
								Misc.logItem("Gambled", newItem, result.line);
								list.push(newItem.gid);
								break;
							default:
								Misc.itemLogger("Sold", newItem, "Gambling");
								me.overhead("Sell: " + newItem.name);
								newItem.sell();

								if (!Config.PacketShopping) {
									delay(500);
								}

								break;
						}
					}
				}
			}

			me.cancel();
		}

		return true;
	};

	Town.needGamble = function () {
		return Config.Gamble && me.gold >= Config.GambleGoldStart;
	};

	Town.getGambledItem = function (list) {
		var i, j,
			items = me.findItems(-1, 0, 3);

		for (i = 0; i < items.length; i += 1) {
			if (list.indexOf(items[i].gid) === -1) {
				for (j = 0; j < 3; j += 1) {
					if (items[i].getFlag(0x10)) {
						break;
					}

					delay(100);
				}

				return items[i];
			}
		}

		return false;
	};

	Town.buyKeys = function () {
		if (!Town.wantKeys()) {
			return true;
		}

		// Fuck Hratli
		if (me.act === 3) {
			Town.goToTown(Pather.accessToAct(4) ? 4 : 2);
		}

		var key,
			npc = Town.initNPC("Key", "buyKeys");

		if (!npc) {
			return false;
		}

		key = npc.getItem("key");

		if (!key) {
			return false;
		}

		try {
			key.buy(true);
		} catch (e) {
			print(e.message);

			return false;
		}

		return true;
	};

	Town.checkKeys = function () {
		const Storage = require('./Storage');
		if (!Config.OpenChests || me.classid === 6 || me.gold < 540 || (!me.getItem("key") && !Storage.Inventory.CanFit({
			sizex: 1,
			sizey: 1
		}))) {
			return 12;
		}

		var i,
			count = 0,
			key = me.findItems(543, 0, 3);

		if (key) {
			for (i = 0; i < key.length; i += 1) {
				count += key[i].getStat(70);
			}
		}

		return count;
	},

		Town.needKeys = function () {
			return Town.checkKeys() <= 0;
		},

		Town.wantKeys = function () {
			return Town.checkKeys() <= 6;
		},

		Town.repairIngredientCheck = function (item) {
			if (!Config.CubeRepair) {
				return false;
			}

			var needRal = 0,
				needOrt = 0,
				items = Town.getItemsForRepair(Config.RepairPercent, false);

			if (items && items.length) {
				while (items.length > 0) {
					switch (items.shift().itemType) {
						case 2:
						case 3:
						case 15:
						case 16:
						case 19:
						case 69:
						case 70:
						case 71:
						case 72:
						case 75:
							needRal += 1;

							break;
						default:
							needOrt += 1;

							break;
					}
				}
			}

			switch (item.classid) {
				case 617:
					if (needRal && (!me.findItems(617) || me.findItems(617) < needRal)) {
						return true;
					}

					break;
				case 618:
					if (needOrt && (!me.findItems(618) || me.findItems(618) < needOrt)) {
						return true;
					}

					break;
			}

			return false;
		};

	Town.cubeRepair = function () {
		if (!Config.CubeRepair || !me.getItem(549)) {
			return false;
		}

		var items = Town.getItemsForRepair(Config.RepairPercent, false);

		items.sort(function (a, b) {
			return a.getStat(72) * 100 / a.getStat(73) - b.getStat(72) * 100 / b.getStat(73);
		});

		while (items.length > 0) {
			Town.cubeRepairItem(items.shift());
		}

		return true;
	};

	Town.cubeRepairItem = function (item) {
		var i, rune, cubeItems,
			bodyLoc = item.bodylocation;
		const Storage = require('./Storage');
		if (item.mode !== 1) {
			return false;
		}

		switch (item.itemType) {
			case 2:
			case 3:
			case 15:
			case 16:
			case 19:
			case 69:
			case 70:
			case 71:
			case 72:
			case 75:
				rune = me.getItem(617); // Ral rune

				break;
			default:
				rune = me.getItem(618); // Ort rune

				break;
		}

		if (rune && Town.openStash() && me.openCube() && me.emptyCube()) {
			for (i = 0; i < 100; i += 1) {
				if (!me.itemoncursor) {
					if (Storage.Cube.MoveTo(item) && Storage.Cube.MoveTo(rune)) {
						transmute();
						delay(1000 + me.ping);
					}

					cubeItems = me.findItems(-1, -1, 6); // Get cube contents

					if (cubeItems.length === 1) { // We expect only one item in cube
						cubeItems[0].toCursor();
					}
				}

				if (me.itemoncursor) {
					for (i = 0; i < 3; i += 1) {
						clickItem(0, bodyLoc);
						delay(me.ping * 2 + 500);

						if (cubeItems[0].bodylocation === bodyLoc) {
							print(cubeItems[0].fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "").trim() + " successfully repaired and equipped.");
							D2Bot.printToConsole(cubeItems[0].fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, "").trim() + " successfully repaired and equipped.", 5);

							return true;
						}
					}
				}

				delay(200);
			}

			Misc.errorReport("Failed to put repaired item back on.");
			D2Bot.stop();
		}

		return false;
	};

	Town.repair = function (force = false) {
		var i, quiver, myQuiver, npc, repairAction, bowCheck;

		Town.cubeRepair();

		repairAction = Town.needRepair();

		if (force && repairAction.indexOf("repair") === -1) {
			repairAction.push("repair");
		}

		if (!repairAction || !repairAction.length) {
			return true;
		}

		for (i = 0; i < repairAction.length; i += 1) {
			switch (repairAction[i]) {
				case "repair":
					npc = Town.initNPC("Repair", "repair");

					if (!npc) {
						return false;
					}

					me.repair();

					break;
				case "buyQuiver":
					bowCheck = me.usingBow;//ToDo; fix

					if (bowCheck) {
						if (bowCheck === "bow") {
							quiver = "aqv"; // Arrows
						} else {
							quiver = "cqv"; // Bolts
						}

						myQuiver = me.getItem(quiver, 1);

						if (myQuiver) {
							myQuiver.drop();
						}

						npc = Town.initNPC("Repair", "repair");

						if (!npc) {
							return false;
						}

						quiver = npc.getItem(quiver);

						if (quiver) {
							quiver.buy();
						}
					}

					break;
			}
		}

		//Town.shopItems();

		return true;
	};

	Town.needRepair = function () {
		var quiver, bowCheck, quantity,
			repairAction = [],
			canAfford = me.gold >= me.getRepairCost();

		// Arrow/Bolt check
		bowCheck = me.usingBow;

		if (bowCheck) {
			switch (bowCheck) {
				case "bow":
					quiver = me.getItem("aqv", 1); // Equipped arrow quiver

					break;
				case "crossbow":
					quiver = me.getItem("cqv", 1); // Equipped bolt quiver

					break;
			}

			if (!quiver) { // Out of arrows/bolts
				repairAction.push("buyQuiver");
			} else {
				quantity = quiver.getStat(70);

				if (typeof quantity === "number" && quantity * 100 / getBaseStat("items", quiver.classid, "maxstack") <= Config.RepairPercent) {
					repairAction.push("buyQuiver");
				}
			}
		}

		// Repair durability/quantity/charges
		if (canAfford) {
			if (Town.getItemsForRepair(Config.RepairPercent, true).length > 0) {
				repairAction.push("repair");
			}
		} else {
			print("ÿc4Town: ÿc1Can't afford repairs.");
		}

		return repairAction;
	};

	Town.getItemsForRepair = function (repairPercent, chargedItems) {
		var i, charge, quantity, durability,
			itemList = [],
			item = me.getItem(-1, 1);

		if (item) {
			do {
				if (!item.getFlag(0x400000)) { // Skip ethereal items
					if (!item.getStat(152)) { // Skip indestructible items
						switch (item.itemType) {
							// Quantity check
							case 42: // Throwing knives
							case 43: // Throwing axes
							case 44: // Javelins
							case 87: // Amazon javelins
								quantity = item.getStat(70);

								if (typeof quantity === "number" && quantity * 100 / (getBaseStat("items", item.classid, "maxstack") + item.getStat(254)) <= repairPercent) { // Stat 254 = increased stack size
									itemList.push(copyUnit(item));
								}

								break;
							// Durability check
							default:
								durability = item.getStat(72);

								if (typeof durability === "number" && durability * 100 / item.getStat(73) <= repairPercent) {
									itemList.push(copyUnit(item));
								}

								break;
						}
					}

					if (chargedItems) {
						// Charged item check
						charge = item.getStat(-2)[204];

						if (typeof (charge) === "object") {
							if (charge instanceof Array) {
								for (i = 0; i < charge.length; i += 1) {
									if (charge[i] !== undefined && charge[i].hasOwnProperty("charges") && charge[i].charges * 100 / charge[i].maxcharges <= repairPercent) {
										itemList.push(copyUnit(item));
									}
								}
							} else if (charge.charges * 100 / charge.maxcharges <= repairPercent) {
								itemList.push(copyUnit(item));
							}
						}
					}
				}
			} while (item.getNext());
		}

		return itemList;
	};

	Town.reviveMerc = function (noBo = false) {
		if (!Town.needMerc()) {
			return true;
		}

		// Fuck Aheara
		if (me.act === 3) {
			Town.goToTown(2);
		}

		var i, tick, dialog, lines,
			preArea = me.area,
			npc = Town.initNPC("Merc", "reviveMerc");

		if (!npc) {
			return false;
		}

		MainLoop:
			for (i = 0; i < 3; i += 1) {
				dialog = getDialogLines();

				for (lines = 0; lines < dialog.length; lines += 1) {
					// No matter what language, the resurrect item is the only entry with a ":" in it
					if (dialog[lines].text.match(":", "gi")) {
						dialog[lines].handler();
						delay(Math.max(750, me.ping * 2));
					}

					// "You do not have enough gold for that."
					if (dialog[lines].text.match(getLocaleString(3362), "gi")) {
						return false;
					}
				}

				while (getTickCount() - tick < 2000) {
					if (!!me.getMerc()) {
						delay(Math.max(750, me.ping * 2));

						break MainLoop;
					}

					delay(200);
				}
			}


		if (!!me.getMerc() && !noBo) {
			if (Config.MercWatch) { // Cast BO on merc so he doesn't just die again
				print("MercWatch precast");
				Pather.useWaypoint("random");
				require('./Precast')();
				Pather.useWaypoint(preArea);
			}

			return true;
		}

		return false;
	};

	Town.needMerc = function () {
		var i, merc;

		if (me.gametype === 0 || !Config.UseMerc || me.gold < me.mercrevivecost) { // gametype 0 = classic
			return false;
		}

		// me.getMerc() might return null if called right after taking a portal, that's why there's retry attempts
		for (i = 0; i < 3; i += 1) {
			merc = me.getMerc();

			if (merc && merc.mode !== 0 && merc.mode !== 12) {
				return false;
			}

			delay(100);
		}

		if (!me.mercrevivecost) { // In case we never had a merc and Config.UseMerc is still set to true for some odd reason
			return false;
		}

		return true;
	};

	Town.canStash = function (item) {
		var ignoredClassids = [91, 174]; // Some quest items that have to be in inventory or equipped
		const Storage = require('./Storage');
		if (ignoredItemTypes.indexOf(item.itemType) > -1 || ignoredClassids.indexOf(item.classid) > -1 || !Storage.Stash.CanFit(item)) {
			return false;
		}

		return true;
	};

	Town.stash = function (stashGold = true) {
		if (!Town.needStash()) {
			return true;
		}
		const Pickit = require('./Pickit');
		me.cancel();
		const Storage = require('./Storage');
		const items = Storage.Inventory.Compare(Config.Inventory);

		if (items) {
			for (let i = 0; i < items.length; i += 1) {
				if (Town.canStash(items[i]) && items[i].location === sdk.storage.Inventory /*yeah we need to check this, as hooks can alter it*/) {
					const item = copyUnit(items[i]);
					let result = Pickit.checkItem(items[i]).result;

					const hook = Pickit.hooks.find(x => x.id === result);
					if (hook) {// Found a hook that linked upon it
						print('Found a hooking item');
						const uniqueId = item.uniqueId;
						result = !hook.handle(item); // If it handled succesfully, it doesnt need to stash it
						if (uniqueId !== item.uniqueId) {
							// If something changed on the item, it means we did something with it
							print('Unique id is changed?');
							// If its still in inventory, lets rerun the entire loop again with the item
							if (item.location === sdk.storage.Inventory) {
								print('Still in inventory, lets parse again');
								i--;
								continue;
							}
							continue; // continue
						}
					}

					if (result === 1) {
						Storage.Stash.MoveTo(items[i]);
					}
				}
			}
		}

		// Stash gold
		if (stashGold) {
			if (me.getStat(14) >= Config.StashGold && me.getStat(15) < 25e5 && Town.openStash()) {
				gold(me.getStat(14), 3);
				delay(1000); // allow UI to initialize
				me.cancel();
			}
		}

		return true;
	};

	Town.needStash = function () {
		if (Config.StashGold && me.getStat(14) >= Config.StashGold && me.getStat(15) < 25e5) {
			return true;
		}
		const Storage = require('./Storage');
		var i,
			items = Storage.Inventory.Compare(Config.Inventory);

		for (i = 0; i < items.length; i += 1) {
			if (Storage.Stash.CanFit(items[i])) {
				return true;
			}
		}

		return false;
	};

	Town.openStash = function () {
		var i, tick, stash;

		if (getUIFlag(0x1a) && !me.closeCube()) {
			return false;
		}

		if (getUIFlag(0x19)) {
			return true;
		}

		for (i = 0; i < 5; i += 1) {
			me.cancel();

			if (Town.move("stash")) {
				stash = getUnit(2, 267);

				if (stash) {
					Misc.click(0, 0, stash);
					//stash.interact();

					tick = getTickCount();

					while (getTickCount() - tick < 5000) {
						if (getUIFlag(0x19)) {
							delay(100 + me.ping * 2); // allow UI to initialize

							return true;
						}

						delay(100);
					}
				}
			}
		}

		return false;
	};

	Town.getCorpse = function () {
		const CollMap = require('./CollMap');
		var i, corpse, gid, coord,
			corpseList = [],
			timer = getTickCount();

		// No equipped items - high chance of dying in last game, force retries
		if (!me.getItem(-1, 1)) {
			for (i = 0; i < 5; i += 1) {
				corpse = getUnit(0, me.name, 17);

				if (corpse) {
					break;
				}

				delay(500);
			}
		} else {
			corpse = getUnit(0, me.name, 17);
		}

		if (!corpse) {
			return true;
		}

		do {
			if (corpse.dead && corpse.name === me.name && (getDistance(me.x, me.y, corpse.x, corpse.y) <= 20 || me.inTown)) {
				corpseList.push(copyUnit(corpse));
			}
		} while (corpse.getNext());

		while (corpseList.length > 0) {
			if (me.dead) {
				return false;
			}

			gid = corpseList[0].gid;

			Pather.moveToUnit(corpseList[0]);
			Misc.click(0, 0, corpseList[0]);
			delay(500);

			if (getTickCount() - timer > 3000) {
				coord = CollMap.getRandCoordinate(me.x, -1, 1, me.y, -1, 1, 4);
				Pather.moveTo(coord.x, coord.y);
			}

			if (getTickCount() - timer > 30000) {
				D2Bot.printToConsole("Failed to get corpse, stopping.", 9);
				D2Bot.stop();
			}

			if (!getUnit(0, -1, -1, gid)) {
				corpseList.shift();
			}
		}

		if (me.gametype === 0) {
			Town.checkShard();
		}

		return true;
	};

	Town.checkShard = function () {
		var shard,
			check = {left: false, right: false},
			item = me.getItem("bld", 0);

		if (item) {
			do {
				if (item.location === 3 && item.quality === 7) {
					shard = copyUnit(item);

					break;
				}
			} while (item.getNext());
		}

		if (!shard) {
			return true;
		}

		item = me.getItem(-1, 1);

		if (item) {
			do {
				if (item.bodylocation === 4) {
					check.right = true;
				}

				if (item.bodylocation === 5) {
					check.left = true;
				}
			} while (item.getNext());
		}

		if (!check.right) {
			shard.toCursor();

			while (me.itemoncursor) {
				clickItem(0, 4);
				delay(500);
			}
		} else if (!check.left) {
			shard.toCursor();

			while (me.itemoncursor) {
				clickItem(0, 5);
				delay(500);
			}
		}

		return true;
	};

	Town.clearBelt = function () {
		while (!me.gameReady) {
			delay(100);
		}

		var item = me.getItem(-1, 2),
			clearList = [];

		if (item) {
			do {
				switch (item.itemType) {
					case 76: // Healing
						if (Config.BeltColumn[item.x % 4] !== "hp") {
							clearList.push(copyUnit(item));
						}

						break;
					case 77: // Mana
						if (Config.BeltColumn[item.x % 4] !== "mp") {
							clearList.push(copyUnit(item));
						}

						break;
					case 78: // Rejuvenation
						if (Config.BeltColumn[item.x % 4] !== "rv") {
							clearList.push(copyUnit(item));
						}

						break;
				}
			} while (item.getNext());

			while (clearList.length > 0) {
				clearList.shift().interact();
				delay(200);
			}
		}

		return true;
	};

	Town.clearScrolls = function () {
		// drop scrolls, unless it is in pickit
		let scrolls = me.getItemsEx()
			.filter(i =>
				i.location === sdk.storage.Inventory &&
				i.mode === sdk.itemmode.inStorage &&
				i.itemType === 22 &&
				require('Pickit').checkItem(i).result == 0
			);

		for (var i = 0; i < scrolls.length; i += 1) {
			if (getUIFlag(0xC) || (Config.PacketShopping && getInteractedNPC() && getInteractedNPC().itemcount > 0)) { // Might as well sell the item if already in shop
				Misc.itemLogger("Sold", scrolls[i]);
				scrolls[i].sell();
			} else {
				Misc.itemLogger("Dropped", scrolls[i], "clearScrolls");
				scrolls[i].drop();
			}
		}

		return true;
	};

	Town.clearInventory = function () {
		var i, col, result, item, beltSize,
			items = [];
		const Storage = require('Storage');
		Town.checkQuestItems(); // only golden bird quest for now
		const Pickit = require('Pickit');
		// Return potions to belt
		item = me.getItem(-1, 0);

		if (item) {
			do {
				if (item.location === 3 && [76, 77, 78].indexOf(item.itemType) > -1) {
					items.push(copyUnit(item));
				}
			} while (item.getNext());

			beltSize = Storage.BeltSize();
			col = Town.checkColumns(beltSize);

			// Sort from HP to RV
			items.sort(function (a, b) {
				return a.itemType - b.itemType;
			});

			while (items.length) {
				item = items.shift();

				for (i = 0; i < 4; i += 1) {
					if (item.code.indexOf(Config.BeltColumn[i]) > -1 && col[i] > 0) {
						if (col[i] === beltSize) { // Pick up the potion and put it in belt if the column is empty
							if (item.toCursor()) {
								clickItem(0, i, 0, 2);
							}
						} else {
							clickItem(2, item.x, item.y, item.location); // Shift-click potion
						}

						delay(me.ping + 200);

						col = Town.checkColumns(beltSize);
					}
				}
			}
		}

		// Cleanup remaining potions
		item = me.getItem(-1, 0);

		if (item) {
			items = [
				[], // array for hp
				[] // array for mp
			];

			do {
				if (item.itemType === 76) {
					items[0].push(copyUnit(item));
				}

				if (item.itemType === 77) {
					items[1].push(copyUnit(item));
				}
			} while (item.getNext());

			// Cleanup healing potions
			while (items[0].length > Config.HPBuffer) {
				items[0].shift().interact();
				delay(200 + me.ping);
			}

			// Cleanup mana potions
			while (items[1].length > Config.MPBuffer) {
				items[1].shift().interact();
				delay(200 + me.ping);
			}
		}

		// Any leftover items from a failed ID (crashed game, disconnect etc.)
		items = Storage.Inventory.Compare(Config.Inventory);

		for (i = 0; !!items && i < items.length; i += 1) {
			if ([18, 41, 76, 77, 78].indexOf(items[i].itemType) === -1 && // Don't drop tomes, keys or potions
				// Keep some quest items
				items[i].classid !== 524 && // Scroll of Inifuss
				items[i].classid !== 525 && // Key to Cairn Stones
				items[i].classid !== 549 && // Horadric Cube
				items[i].classid !== 92 && // Staff of Kings
				items[i].classid !== 521 && // Viper Amulet
				items[i].classid !== 91 && // Horadric Staff
				items[i].classid !== 552 && // Book of Skill
				items[i].classid !== 545 && // Potion of Life
				items[i].classid !== 546 && // A Jade Figurine
				items[i].classid !== 547 && // The Golden Bird
				items[i].classid !== 548 && // Lam Esen's Tome
				items[i].classid !== 553 && // Khalim's Eye
				items[i].classid !== 554 && // Khalim's Heart
				items[i].classid !== 555 && // Khalim's Brain
				items[i].classid !== 173 && // Khalim's Flail
				items[i].classid !== 174 && // Khalim's Will
				items[i].classid !== 644 && // Malah's Potion
				items[i].classid !== 646 && // Scroll of Resistance
				//
				(items[i].code !== 529 || !!me.findItem(518, 0, 3)) && // Don't throw scrolls if no tome is found (obsolete code?)
				(items[i].code !== 530 || !!me.findItem(519, 0, 3)) // Don't throw scrolls if no tome is found (obsolete code?)
			) {
				result = Pickit.checkItem(items[i]).result;

				switch (result) {
					case 0: // Drop item
						if ((getUIFlag(0x0C) || getUIFlag(0x08)) && (items[i].getItemCost(1) <= 1 || items[i].itemType === 39)) { // Quest items and such
							me.cancel();
							delay(200);
						}

						if (getUIFlag(0xC) || (Config.PacketShopping && getInteractedNPC() && getInteractedNPC().itemcount > 0)) { // Might as well sell the item if already in shop
							print("clearInventory sell " + items[i].name);
							Misc.itemLogger("Sold", items[i]);
							items[i].sell();
						} else {
							Misc.itemLogger("Dropped", items[i], "clearInventory");
							items[i].drop();
						}

						break;
					case 4: // Sell item
						try {
							print("LowGold sell " + items[i].name);
							Town.initNPC("Shop", "clearInventory");
							Misc.itemLogger("Sold", items[i]);
							items[i].sell();
						} catch (e) {
							print(e);
						}

						break;
				}
			}
		}

		return true;
	};

	const act = [{}, {}, {}, {}, {}];

	Town.ActData = act;

	Town.initialize = function () {
		//print("Initialize town " + me.act);

		switch (me.act) {
			case 1:
				var fire,
					wp = getPresetUnit(1, 2, 119),
					fireUnit = getPresetUnit(1, 2, 39);

				if (!fireUnit) {
					return false;
				}

				fire = [fireUnit.roomx * 5 + fireUnit.x, fireUnit.roomy * 5 + fireUnit.y];

				act[0].spot = {};
				act[0].spot.stash = [fire[0] - 7, fire[1] - 12];
				act[0].spot[NPC.Warriv] = [fire[0] - 5, fire[1] - 2];
				act[0].spot[NPC.Cain] = [fire[0] + 6, fire[1] - 5];
				act[0].spot[NPC.Kashya] = [fire[0] + 14, fire[1] - 4];
				act[0].spot[NPC.Akara] = [fire[0] + 56, fire[1] - 30];
				act[0].spot[NPC.Charsi] = [fire[0] - 39, fire[1] - 25];
				act[0].spot[NPC.Gheed] = [fire[0] - 34, fire[1] + 36];
				act[0].spot.portalspot = [fire[0] + 10, fire[1] + 18];
				act[0].spot.waypoint = [wp.roomx * 5 + wp.x, wp.roomy * 5 + wp.y];
				act[0].initialized = true;

				break;
			case 2:
				act[1].spot = {};
				act[1].spot[NPC.Fara] = [5124, 5082];
				act[1].spot[NPC.Cain] = [5124, 5082];
				act[1].spot[NPC.Lysander] = [5118, 5104];
				act[1].spot[NPC.Greiz] = [5033, 5053];
				act[1].spot[NPC.Elzix] = [5032, 5102];
				act[1].spot.palace = [5088, 5153];
				act[1].spot.sewers = [5221, 5181];
				act[1].spot[NPC.Meshif] = [5205, 5058];
				act[1].spot[NPC.Drognan] = [5097, 5035];
				act[1].spot[NPC.Atma] = [5137, 5060];
				act[1].spot[NPC.Warriv] = [5152, 5201];
				act[1].spot.portalspot = [5168, 5060];
				act[1].spot.stash = [5124, 5076];
				act[1].spot.waypoint = [5070, 5083];
				act[1].initialized = true;

				break;
			case 3:
				act[2].spot = {};
				act[2].spot[NPC.Meshif] = [5118, 5168];
				act[2].spot[NPC.Hratli] = [5223, 5048, 5127, 5172];
				act[2].spot[NPC.Ormus] = [5129, 5093];
				act[2].spot[NPC.Asheara] = [5043, 5093];
				act[2].spot[NPC.Alkor] = [5083, 5016];
				act[2].spot[NPC.Cain] = [5148, 5066];
				act[2].spot.stash = [5144, 5059];
				act[2].spot.portalspot = [5150, 5063];
				act[2].spot.waypoint = [5158, 5050];
				act[2].initialized = true;

				break;
			case 4:
				act[3].spot = {};
				act[3].spot[NPC.Cain] = [5027, 5027];
				act[3].spot[NPC.Halbu] = [5089, 5031];
				act[3].spot[NPC.Tyrael] = [5027, 5027];
				act[3].spot[NPC.Jamella] = [5088, 5054];
				act[3].spot.stash = [5022, 5040];
				act[3].spot.portalspot = [5045, 5042];
				act[3].spot.waypoint = [5043, 5018];
				act[3].initialized = true;

				break;
			case 5:
				act[4].spot = {};
				act[4].spot.portalspot = [5098, 5019];
				act[4].spot.stash = [5129, 5061];
				act[4].spot[NPC.Larzuk] = [5141, 5045];
				act[4].spot[NPC.Malah] = [5078, 5029];
				act[4].spot[NPC.Cain] = [5119, 5061];
				act[4].spot[NPC.Qual_Kehk] = [5066, 5083];
				act[4].spot[NPC.Anya] = [5112, 5120];
				act[4].spot.portal = [5118, 5120];
				act[4].spot.waypoint = [5113, 5068];
				act[4].spot[NPC.Nihlathak] = [5071, 5111];
				act[4].initialized = true;

				break;
		}

		return true;
	};

	Town.move = function (spot) {
		if (!me.inTown) {
			Town.goToTown();
		}

		var i, path;

		if (!act[me.act - 1].initialized) {
			Town.initialize();
		}

		// Act 5 wp->portalspot override - ActMap.cpp crash
		if (me.act === 5 && spot === "portalspot" && getDistance(me.x, me.y, 5113, 5068) <= 8) {
			path = [5113, 5068, 5108, 5051, 5106, 5046, 5104, 5041, 5102, 5027, 5098, 5018];

			for (i = 0; i < path.length; i += 2) {
				Pather.walkTo(path[i], path[i + 1]);
			}

			return true;
		}

		for (i = 0; i < 3; i += 1) {
			if (Town.moveToSpot(spot)) {
				return true;
			}
		}

		return false;
	};

	Town.moveToSpot = function (spot) {
		var i, path, townSpot,
			longRange = (spot === "waypoint");

		if (!act[me.act - 1].hasOwnProperty("spot") || !act[me.act - 1].spot.hasOwnProperty(spot)) {
			return false;
		}

		if (typeof (act[me.act - 1].spot[spot]) === "object") {
			townSpot = act[me.act - 1].spot[spot];
		} else {
			return false;
		}

		if (longRange) {
			path = getPath(me.area, townSpot[0], townSpot[1], me.x, me.y, 1, 8);

			if (path && path[1]) {
				townSpot = [path[1].x, path[1].y];
			}
		}

		for (i = 0; i < townSpot.length; i += 2) {
			//print("moveToSpot: " + spot + " from " + me.x + ", " + me.y);

			if (getDistance(me, townSpot[i], townSpot[i + 1]) > 2) {
				Pather.moveTo(townSpot[i], townSpot[i + 1], 3, false, true);
			}

			switch (spot) {
				case "stash":
					if (!!getUnit(2, 267)) {
						return true;
					}

					break;
				case "palace":
					if (!!getUnit(1, NPC.Jerhyn)) {
						return true;
					}

					break;
				case "portalspot":
				case "sewers":
					if (getDistance(me, townSpot[i], townSpot[i + 1]) < 10) {
						return true;
					}

					break;
				case "waypoint":
					if (!!getUnit(2, "waypoint")) {
						return true;
					}

					break;
				default:
					if (!!getUnit(1, spot)) {
						return true;
					}

					break;
			}
		}

		return false;
	};

	Town.goToTown = function (act, wpmenu) {
		var towns = [1, 40, 75, 103, 109];

		if (!me.inTown) {
			if (!Pather.makePortal()) {
				throw new Error("Town.goToTown: Failed to make TP");
			}

			if (!Pather.usePortal(null, me.name)) {
				throw new Error("Town.goToTown: Failed to take TP");
			}
		}

		if (act === undefined) {
			return Town;
		}

		if (act < 1 || act > 5) {
			throw new Error("Town.goToTown: Invalid act");
		}

		if (act !== me.act) {
			try {
				Pather.useWaypoint(towns[act - 1], wpmenu);
			} catch (WPError) {
				throw new Error("Town.goToTown: Failed use WP");
			}
		}

		return Town;
	};

	Town.visitTown = function (repair = false) {
		if (me.inTown) {
			Town();
			Town.move("stash");

			return true;
		}

		var preArea = me.area,
			preAct = me.act;

		try { // not an essential function -> handle thrown errors
			Town.goToTown();
		} catch (e) {
			return false;
		}

		Town(repair);

		if (me.act !== preAct) {
			Town.goToTown(preAct);
		}

		Town.move("portalspot");

		if (!Pather.usePortal(preArea, me.name)) { // this part is essential
			throw new Error("Town.visitTown: Failed to go back from town");
		}

		if (Config.PublicMode) {
			Pather.makePortal();
		}

		return true;
	};

	const ignoredItemTypes = Town.ignoredItemTypes = [ // Items that won't be stashed
		5, // Arrows
		6, // Bolts
		18, // Book (Tome)
		22, // Scroll
		38, // Missile Potion
		41, // Key
		76, // Healing Potion
		77, // Mana Potion
		78, // Rejuvenation Potion
		79, // Stamina Potion
		80, // Antidote Potion
		81 // Thawing Potion
	]
	module.exports = Town;
})
(module, require);