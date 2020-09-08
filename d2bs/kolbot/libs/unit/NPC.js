// Open NPC menu
Unit.prototype.openMenu = function (addDelay) {
	const Pather = require('../modules/Pather');
	const Misc = require('../modules/Misc');

	if (this.type !== 1) {
		throw new Error("Unit.openMenu: Must be used on NPCs.");
	}

	if (addDelay === undefined) {
		addDelay = 0;
	}

	if (getUIFlag(0x08)) {
		return true;
	}

	var i, tick;

	for (i = 0; i < 5; i += 1) {
		if (getDistance(me, this) > 4) {
			Pather.moveToUnit(this);
		}

		Misc.click(0, 0, this);
		tick = getTickCount();

		while (getTickCount() - tick < 5000) {
			if (getUIFlag(0x08)) {
				delay(Math.max(700 + me.ping, 500 + me.ping * 2 + addDelay * 500));

				return true;
			}

			if (getInteractedNPC()) {
				me.cancel();
			}

			delay(100);
		}

		sendPacket(1, 0x2f, 4, 1, 4, this.gid);
		delay(me.ping * 2 + 1);
		sendPacket(1, 0x30, 4, 1, 4, this.gid);
		delay(me.ping * 2 + 1);
	}

	return false;
};

// Open NPC menu
Unit.prototype.__openMenu = function () {

	// Normal openMenu checks for Packet handler, we can do this with packets anyway

	// ensure we are close to the motherfucker

	for (let i = 0; i < 10 && !getUIFlag(0x08/*NPCMenu*/); i++) {
		i && print('Talking to npc attempt #' + i);
		if (this.distance > 2) this.moveTo();

		// Wait until we are idle
		while (!me.idle) delay(10);

		clickMap(0, 0, this); // Click ON the npc (might walk to it if it moves too)

		// give a bit of time for the state to popup
		let tick = getTickCount();
		while (!getUIFlag(8/*NPCMenu*/) && getTickCount() - tick < Math.min(Math.max((me.ping || 1) * 10, 400), 100)) delay(3);

		// if we are interacting with the npc, but we find no selectable text,
		if (!getUIFlag(8/*NPCMenu*/) && getInteractedNPC() && !getDialogLines() && !getUIFlag(0x0C/*not shopping*/)) {

			print('seems like its just text, cancel that shit');
			// we can assume we are listing to some boring story, cancel that shit
			me.cancel();
			delay(100); // give it all a sec
		}
	}

	print('opened the menu');
	return !!(getUIFlag(0x08/*NPCMenu*/) && getDialogLines())
};

// mode = "Gamble", "Repair" or "Shop"
Unit.prototype.startTrade = function (mode) {
	const Config = require('../modules/Config');
	const Packet = require('../modules/PacketHelpers');
	// if (Config.PacketShopping) {
	// 	return Packet.startTrade(this, mode);
	// }

	if (this.type !== 1) {
		throw new Error("Unit.startTrade: Must be used on NPCs.");
	}

	if (getUIFlag(0x0C)) {
		return true;
	}
	const Misc = require('../modules/Misc');

	var i, tick,
		menuId = mode === "Gamble" ? 0x0D46 : mode === "Repair" ? 0x0D06 : 0x0D44;

	for (i = 0; i < 3; i += 1) {
		if (this.openMenu(i)) { // Incremental delay on retries
			Misc.useMenu(menuId);

			tick = getTickCount();

			while (getTickCount() - tick < 1000) {
				if (getUIFlag(0x0C) && this.itemcount > 0) {
					delay(200);

					return true;
				}

				delay(25);
			}

			me.cancel();
		}
	}

	return false;
};

Unit.prototype.buy = function (shiftBuy, gamble) {
	const Config = require('../modules/Config');
	const Packet = require('../modules/PacketHelpers');
	if (Config.PacketShopping) {
		return Packet.buyItem(this, shiftBuy, gamble);
	}

	if (this.type !== 4) { // Check if it's an item we want to buy
		throw new Error("Unit.buy: Must be used on items.");
	}

	if (!getUIFlag(0xC) || (this.getParent() && this.getParent().gid !== getInteractedNPC().gid)) { // Check if it's an item belonging to a NPC
		throw new Error("Unit.buy: Must be used in shops.");
	}

	if (me.gold < this.getItemCost(0)) { // Can we afford the item?
		return false;
	}

	var i, tick,
		oldGold = me.gold,
		itemCount = me.itemcount;

	for (i = 0; i < 3; i += 1) {
		//print("BUY " + this.name + " " + i);

		this.shop(shiftBuy ? 6 : 2);

		tick = getTickCount();

		while (getTickCount() - tick < Math.max(2000, me.ping * 2 + 500)) {
			if (shiftBuy && me.gold < oldGold) {
				delay(500);

				return true;
			}

			if (itemCount !== me.itemcount) {
				delay(500);

				return true;
			}

			delay(10);
		}
	}

	return false;
};
