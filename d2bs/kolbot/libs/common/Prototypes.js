/**
*	@filename	Prototypes.js
*	@author		kolton
*	@desc		various 'Unit' and 'me' prototypes
*/

// Shuffle Array
// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
Array.prototype.shuffle = function () {
	var temp, index,
		counter = this.length;

	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		index = Math.floor(Math.random() * counter);

		// Decrease counter by 1
		counter -= 1;

		// And swap the last element with it
		temp = this[counter];
		this[counter] = this[index];
		this[index] = temp;
	}

	return this;
};

// Trim String
String.prototype.trim = function () {
	return this.replace(/^\s+|\s+$/g, "");
};

// Check if unit is idle
Unit.prototype.__defineGetter__("idle",
	function () {
		if (this.type > 0) {
			throw new Error("Unit.idle: Must be used with player units.");
		}

		return (this.mode === 1 || this.mode === 5 || this.mode === 17); // Dead is pretty idle too
	});

Unit.prototype.__defineGetter__("gold",
	function () {
		return this.getStat(14) + this.getStat(15);
	});

// Death check
Unit.prototype.__defineGetter__("dead",
	function () {
		switch (this.type) {
		case 0: // Player
			return this.mode === 0 || this.mode === 17;
		case 1: // Monster
			return this.mode === 0 || this.mode === 12;
		default:
			return false;
		}
	});

// Check if unit is in town
Unit.prototype.__defineGetter__("inTown",
	function () {
		if (this.type > 0) {
			throw new Error("Unit.inTown: Must be used with player units.");
		}

		return [1, 40, 75, 103, 109].indexOf(this.area) > -1;
	});

// Check if party unit is in town
Party.prototype.__defineGetter__("inTown",
	function () {
		return [1, 40, 75, 103, 109].indexOf(this.area) > -1;
	});

Unit.prototype.__defineGetter__("attacking",
	function () {
		if (this.type > 0) {
			throw new Error("Unit.attacking: Must be used with player units.");
		}

		return [7, 8, 10, 11, 12, 13, 14, 15, 16, 18].indexOf(this.mode) > -1;
	});

// Open NPC menu
Unit.prototype.openMenu = function (addDelay) {
	const Config = require('Config');
	if (Config.PacketShopping) {
		return Packet.openMenu(this);
	}

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

			if (getInteractedNPC() && getTickCount() - tick > 1000) {
				me.cancel();
			}

			delay(100);
		}

		sendPacket(1, 0x2f, 4, 1, 4, this.gid);
		delay(me.ping * 2);
		sendPacket(1, 0x30, 4, 1, 4, this.gid);
		delay(me.ping * 2);
	}

	return false;
};

// mode = "Gamble", "Repair" or "Shop"
Unit.prototype.startTrade = function (mode) {
	const Config = require('Config');
	if (Config.PacketShopping) {
		return Packet.startTrade(this, mode);
	}

	if (this.type !== 1) {
		throw new Error("Unit.startTrade: Must be used on NPCs.");
	}

	if (getUIFlag(0x0C)) {
		return true;
	}

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
	const Config = require('Config');
	if (Config.PacketShopping) {
		return Packet.buyItem(this, shiftBuy, gamble);
	}

	if (this.type !== 4) { // Check if it's an item we want to buy
		throw new Error("Unit.buy: Must be used on items.");
	}

	if (!getUIFlag(0xC) || (this.getParent() && this.getParent().gid !== getInteractedNPC().gid)) { // Check if it's an item belonging to a NPC
		throw new Error("Unit.buy: Must be used in shops.");
	}

	if (me.getStat(14) + me.getStat(15) < this.getItemCost(0)) { // Can we afford the item?
		return false;
	}

	var i, tick,
		oldGold = me.getStat(14) + me.getStat(15),
		itemCount = me.itemcount;

	for (i = 0; i < 3; i += 1) {
		//print("BUY " + this.name + " " + i);

		this.shop(shiftBuy ? 6 : 2);

		tick = getTickCount();

		while (getTickCount() - tick < Math.max(2000, me.ping * 2 + 500)) {
			if (shiftBuy && me.getStat(14) + me.getStat(15) < oldGold) {
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

// Item owner name
Unit.prototype.__defineGetter__("parentName",
	function () {
		if (this.type !== 4) {
			throw new Error("Unit.parentName: Must be used with item units.");
		}

		var parent = this.getParent();

		if (parent) {
			return parent.name;
		}

		return false;
	});

// You MUST use a delay after Unit.sell() if using custom scripts. delay(500) works best, dynamic delay is used when identifying/selling (500 - item id time)
Unit.prototype.sell = function () {
	const Config = require('Config');
	if (Config.PacketShopping) {
		return Packet.sellItem(this);
	}

	if (this.type !== 4) { // Check if it's an item we want to buy
		throw new Error("Unit.sell: Must be used on items.");
	}

	if (!getUIFlag(0xC)) { // Check if it's an item belonging to a NPC
		throw new Error("Unit.sell: Must be used in shops.");
	}

	var i, tick,
		itemCount = me.itemcount;

	for (i = 0; i < 5; i += 1) {
		this.shop(1);

		tick = getTickCount();

		while (getTickCount() - tick < 2000) {
			if (me.itemcount !== itemCount) {
				//delay(500);

				return true;
			}

			delay(10);
		}
	}

	return false;
};

Unit.prototype.toCursor = function () {
	if (this.type !== 4) {
		throw new Error("Unit.toCursor: Must be used with items.");
	}

	if (me.itemoncursor && this.mode === 4) {
		return true;
	}

	let i, tick;

	if (this.location === 7) {
		const Town = require('NPC');
		Town.openStash();
	}

	if (this.location === 6) {
		Cubing.openCube();
	}

	for (i = 0; i < 3; i += 1) {
		try {
			if (this.mode === 1) {
				clickItem(0, this.bodylocation); // fix for equipped items (cubing viper staff for example)
			} else {
				clickItem(0, this);
			}
		} catch (e) {
			return false;
		}

		tick = getTickCount();

		while (getTickCount() - tick < 1000) {
			if (me.itemoncursor) {
				delay(200);

				return true;
			}

			delay(10);
		}
	}

	return false;
};

Unit.prototype.drop = function () {
	if (this.type !== 4) {
		throw new Error("Unit.drop: Must be used with items.");
	}

	var i, tick, timeout;

	if (!this.toCursor()) {
		return false;
	}

	tick = getTickCount();
	timeout = Math.max(1000, me.ping * 6);

	while (getUIFlag(0x1a) || getUIFlag(0x19) || !me.gameReady) {
		if (getTickCount() - tick > timeout) {
			return false;
		}

		if (getUIFlag(0x1a) || getUIFlag(0x19)) {
			me.cancel(0);
		}

		delay(me.ping * 2 + 100);
	}

	for (i = 0; i < 3; i += 1) {
		clickMap(0, 0, me.x, me.y);
		delay(40);
		clickMap(2, 0, me.x, me.y);

		tick = getTickCount();

		while (getTickCount() - tick < 500) {
			if (!me.itemoncursor) {
				delay(200);

				return true;
			}

			delay(10);
		}
	}

	return false;
};

me.findItem = function (id, mode, loc, quality) {
	if (id === undefined) {
		id = -1;
	}

	if (mode === undefined) {
		mode = -1;
	}

	if (loc === undefined) {
		loc = -1;
	}

	if (quality === undefined) {
		quality = -1;
	}

	var item = me.getItem(id, mode);

	if (item) {
		do {
			if ((loc === -1 || item.location === loc) && (quality === -1 || item.quality === quality)) {
				return item;
			}
		} while (item.getNext());
	}

	return false;
};

me.findItems = function (id, mode, loc) {
	if (id === undefined) {
		id = -1;
	}

	if (mode === undefined) {
		mode = -1;
	}

	if (loc === undefined) {
		loc = false;
	}

	var list = [],
		item = me.getItem(id, mode);

	if (!item) {
		return false;
	}

	do {
		if (loc) {
			if (item.location === loc) {
				list.push(copyUnit(item));
			}
		} else {
			list.push(copyUnit(item));
		}
	} while (item.getNext());

	return list;
};

Unit.prototype.getPrefix = function (id) {
	var i;

	switch (typeof id) {
	case "number":
		if (typeof this.prefixnums !== "object") {
			return this.prefixnum === id;
		}

		for (i = 0; i < this.prefixnums.length; i += 1) {
			if (id === this.prefixnums[i]) {
				return true;
			}
		}

		break;
	case "string":
		if (typeof this.prefixes !== "object") {
			return this.prefix.replace(/\s+/g, "").toLowerCase() === id.replace(/\s+/g, "").toLowerCase();
		}

		for (i = 0; i < this.prefixes.length; i += 1) {
			if (id.replace(/\s+/g, "").toLowerCase() === this.prefixes[i].replace(/\s+/g, "").toLowerCase()) {
				return true;
			}
		}

		break;
	}

	return false;
};

Unit.prototype.getSuffix = function (id) {
	var i;

	switch (typeof id) {
	case "number":
		if (typeof this.suffixnums !== "object") {
			return this.suffixnum === id;
		}

		for (i = 0; i < this.suffixnums.length; i += 1) {
			if (id === this.suffixnums[i]) {
				return true;
			}
		}

		break;
	case "string":
		if (typeof this.suffixes !== "object") {
			return this.suffix.replace(/\s+/g, "").toLowerCase() === id.replace(/\s+/g, "").toLowerCase();
		}

		for (i = 0; i < this.suffixes.length; i += 1) {
			if (id.replace(/\s+/g, "").toLowerCase() === this.suffixes[i].replace(/\s+/g, "").toLowerCase()) {
				return true;
			}
		}

		break;
	}

	return false;
};

Unit.prototype.__defineGetter__("dexreq",
	function () {
		var finalReq,
			ethereal = this.getFlag(0x400000),
			reqModifier = this.getStat(91),
			baseReq = getBaseStat("items", this.classid, "reqdex");

		finalReq = baseReq + Math.floor(baseReq * reqModifier / 100);

		if (ethereal) {
			finalReq -= 10;
		}

		return Math.max(finalReq, 0);
	});

Unit.prototype.__defineGetter__("strreq",
	function () {
		var finalReq,
			ethereal = this.getFlag(0x400000),
			reqModifier = this.getStat(91),
			baseReq = getBaseStat("items", this.classid, "reqstr");

		finalReq = baseReq + Math.floor(baseReq * reqModifier / 100);

		if (ethereal) {
			finalReq -= 10;
		}

		return Math.max(finalReq, 0);
	});

Unit.prototype.__defineGetter__('itemclass',
	function () {
		if (getBaseStat(0, this.classid, 'code') === undefined) {
			return 0;
		}

		if (getBaseStat(0, this.classid, 'code') === getBaseStat(0, this.classid, 'ultracode')) {
			return 2;
		}

		if (getBaseStat(0, this.classid, 'code') === getBaseStat(0, this.classid, 'ubercode')) {
			return 1;
		}

		return 0;
	});

Unit.prototype.getStatEx = function (id, subid) {
	var i, temp, rval, regex;

	switch (id) {
	case 20: // toblock
		switch (this.classid) {
		case 328: // buckler
			return this.getStat(20);
		case 413: // preserved
		case 483: // mummified
		case 503: // minion
			return this.getStat(20) - 3;
		case 329: // small
		case 414: // zombie
		case 484: // fetish
		case 504: // hellspawn
			return this.getStat(20) - 5;
		case 331: // kite
		case 415: // unraveller
		case 485: // sexton
		case 505: // overseer
			return this.getStat(20) - 8;
		case 351: // spiked
		case 374: // deefender
		case 416: // gargoyle
		case 486: // cantor
		case 506: // succubus
		case 408: // targe
		case 478: // akaran t
			return this.getStat(20) - 10;
		case 330: // large
		case 375: // round
		case 417: // demon
		case 487: // hierophant
		case 507: // bloodlord
			return this.getStat(20) - 12;
		case 376: // scutum
			return this.getStat(20) - 14;
		case 409: // rondache
		case 479: // akaran r
			return this.getStat(20) - 15;
		case 333: // goth
		case 379: // ancient
			return this.getStat(20) - 16;
		case 397: // barbed
			return this.getStat(20) - 17;
		case 377: // dragon
			return this.getStat(20) - 18;
		case 502: // vortex
			return this.getStat(20) - 19;
		case 350: // bone
		case 396: // grim
		case 445: // luna
		case 467: // blade barr
		case 466: // troll
		case 410: // heraldic
		case 480: // protector
			return this.getStat(20) - 20;
		case 444: // heater
		case 447: // monarch
		case 411: // aerin
		case 481: // gilded
		case 501: // zakarum
			return this.getStat(20) - 22;
		case 332: // tower
		case 378: // pavise
		case 446: // hyperion
		case 448: // aegis
		case 449: // ward
			return this.getStat(20) - 24;
		case 412: // crown
		case 482: // royal
		case 500: // kurast
			return this.getStat(20) - 25;
		case 499: // sacred r
			return this.getStat(20) - 28;
		case 498: // sacred t
			return this.getStat(20) - 30;
		}

		break;
	case 21: // plusmindamage
	case 22: // plusmaxdamage
		if (subid === 1) {
			temp = this.getStat(-1);
			rval = 0;

			for (i = 0; i < temp.length; i += 1) {
				switch (temp[i][0]) {
				case id: // plus one handed dmg
				case id + 2: // plus two handed dmg
					// There are 2 occurrences of min/max if the item has +damage. Total damage is the sum of both.
					// First occurrence is +damage, second is base item damage.

					if (rval) { // First occurence stored, return if the second one exists
						return rval;
					}

					if (this.getStat(temp[i][0]) > 0 && this.getStat(temp[i][0]) > temp[i][2]) {
						rval = temp[i][2]; // Store the potential +dmg value
					}

					break;
				}
			}

			return 0;
		}

		break;
	case 31: // plusdefense
		if (subid === 0) {
			if ([0, 1].indexOf(this.mode) < 0) {
				break;
			}

			switch (this.itemType) {
			case 58: // jewel
			case 82: // charms
			case 83:
			case 84:
				// defense is the same as plusdefense for these items
				return this.getStat(31);
			}

			if (!this.desc) {
				this.desc = this.description;
			}

			temp = this.desc.split("\n");
			regex = new RegExp("\\+\\d+ " + getLocaleString(3481).replace(/^\s+|\s+$/g, ""));

			for (i = 0; i < temp.length; i += 1) {
				if (temp[i].match(regex, "i")) {
					return parseInt(temp[i].replace(/ÿc[0-9!"+<;.*]/, ""), 10);
				}
			}

			return 0;
		}

		break;
	case 57:
		if (subid === 1) {
			return Math.round(this.getStat(57) * this.getStat(59) / 256);
		}

		break;
	case 83: // itemaddclassskills
		if (subid === undefined) {
			for (i = 0; i < 7; i += 1) {
				if (this.getStat(83, i)) {
					return this.getStat(83, i);
				}
			}

			return 0;
		}

		break;
	case 188: // itemaddskilltab
		if (subid === undefined) {
			temp = [0, 1, 2, 8, 9, 10, 16, 17, 18, 24, 25, 26, 32, 33, 34, 40, 41, 42, 48, 49, 50];

			for (i = 0; i < temp.length; i += 1) {
				if (this.getStat(188, temp[i])) {
					return this.getStat(188, temp[i]);
				}
			}

			return 0;
		}

		break;
	case 195: // itemskillonattack
	case 198: // itemskillonhit
	case 204: // itemchargedskill
		if (subid === undefined) {
			temp = this.getStat(-2);

			if (temp.hasOwnProperty(id)) {
				if (temp[id] instanceof Array) {
					for (i = 0; i < temp[id].length; i += 1) {
						if (temp[id][i] !== undefined) {
							return temp[id][i].skill;
						}
					}
				} else {
					return temp[id].skill;
				}
			}

			return 0;
		}

		break;
	}

	if (this.getFlag(0x04000000)) { // Runeword
		switch (id) {
		case 16: // enhanceddefense
			if ([0, 1].indexOf(this.mode) < 0) {
				break;
			}

			if (!this.desc) {
				this.desc = this.description;
			}

			temp = this.desc.split("\n");

			for (i = 0; i < temp.length; i += 1) {
				if (temp[i].match(getLocaleString(3520).replace(/^\s+|\s+$/g, ""), "i")) {
					return parseInt(temp[i].replace(/ÿc[0-9!"+<;.*]/, ""), 10);
				}
			}

			return 0;
		case 18: // enhanceddamage
			if ([0, 1].indexOf(this.mode) < 0) {
				break;
			}

			if (!this.desc) {
				this.desc = this.description;
			}

			temp = this.desc.split("\n");

			for (i = 0; i < temp.length; i += 1) {
				if (temp[i].match(getLocaleString(10038).replace(/^\s+|\s+$/g, ""), "i")) {
					return parseInt(temp[i].replace(/ÿc[0-9!"+<;.*]/, ""), 10);
				}
			}

			return 0;
		}
	}

	if (subid === undefined) {
		return this.getStat(id);
	}

	return this.getStat(id, subid);
};

/*
	_NTIPAliasColor["black"] = 3;
	_NTIPAliasColor["lightblue"] = 4;
	_NTIPAliasColor["darkblue"] = 5;
	_NTIPAliasColor["crystalblue"] = 6;
	_NTIPAliasColor["lightred"] = 7;
	_NTIPAliasColor["darkred"] = 8;
	_NTIPAliasColor["crystalred"] = 9;
	_NTIPAliasColor["darkgreen"] = 11;
	_NTIPAliasColor["crystalgreen"] = 12;
	_NTIPAliasColor["lightyellow"] = 13;
	_NTIPAliasColor["darkyellow"] = 14;
	_NTIPAliasColor["lightgold"] = 15;
	_NTIPAliasColor["darkgold"] = 16;
	_NTIPAliasColor["lightpurple"] = 17;
	_NTIPAliasColor["orange"] = 19;
	_NTIPAliasColor["white"] = 20;
*/

Unit.prototype.getColor = function () {
	var i, colors,
		Color = {
			black: 3,
			lightblue: 4,
			darkblue: 5,
			crystalblue: 6,
			lightred: 7,
			darkred: 8,
			crystalred: 9,
			darkgreen: 11,
			crystalgreen: 12,
			lightyellow: 13,
			darkyellow: 14,
			lightgold: 15,
			darkgold: 16,
			lightpurple: 17,
			orange: 19,
			white: 20
		};

	// check type
	if ([2, 3, 15, 16, 19, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 42, 43, 44, 67, 68, 71, 72, 85, 86, 87, 88].indexOf(this.itemType) === -1) {
		return -1;
	}

	// check quality
	if ([4, 5, 6, 7].indexOf(this.quality) === -1) {
		return -1;
	}

	if (this.quality === 4 || this.quality === 6) {
		colors = {
			"Screaming": Color.orange,
			"Howling": Color.orange,
			"Wailing": Color.orange,
			"Sapphire": Color.lightblue,
			"Snowy": Color.lightblue,
			"Shivering": Color.lightblue,
			"Boreal": Color.lightblue,
			"Hibernal": Color.lightblue,
			"Ruby": Color.lightred,
			"Amber": Color.lightyellow,
			"Static": Color.lightyellow,
			"Glowing": Color.lightyellow,
			"Buzzing": Color.lightyellow,
			"Arcing": Color.lightyellow,
			"Shocking": Color.lightyellow,
			"Emerald": Color.crystalgreen,
			"Saintly": Color.darkgold,
			"Holy": Color.darkgold,
			"Godly": Color.darkgold,
			"Visionary": Color.white,
			"Mnemonic": Color.crystalblue,
			"Bowyer's": Color.lightgold,
			"Gymnastic": Color.lightgold,
			"Spearmaiden's": Color.lightgold,
			"Archer's": Color.lightgold,
			"Athlete's": Color.lightgold,
			"Lancer's": Color.lightgold,
			"Charged": Color.lightgold,
			"Blazing": Color.lightgold,
			"Freezing": Color.lightgold,
			"Glacial": Color.lightgold,
			"Powered": Color.lightgold,
			"Volcanic": Color.lightgold,
			"Blighting": Color.lightgold,
			"Noxious": Color.lightgold,
			"Mojo": Color.lightgold,
			"Cursing": Color.lightgold,
			"Venomous": Color.lightgold,
			"Golemlord's": Color.lightgold,
			"Warden's": Color.lightgold,
			"Hawk Branded": Color.lightgold,
			"Commander's": Color.lightgold,
			"Marshal's": Color.lightgold,
			"Rose Branded": Color.lightgold,
			"Guardian's": Color.lightgold,
			"Veteran's": Color.lightgold,
			"Resonant": Color.lightgold,
			"Raging": Color.lightgold,
			"Echoing": Color.lightgold,
			"Furious": Color.lightgold,
			"Master's": Color.lightgold, // there's 2x masters...
			"Caretaker's": Color.lightgold,
			"Terrene": Color.lightgold,
			"Feral": Color.lightgold,
			"Gaean": Color.lightgold,
			"Communal": Color.lightgold,
			"Keeper's": Color.lightgold,
			"Sensei's": Color.lightgold,
			"Trickster's": Color.lightgold,
			"Psychic": Color.lightgold,
			"Kenshi's": Color.lightgold,
			"Cunning": Color.lightgold,
			"Shadow": Color.lightgold,
			"Faithful": Color.white,
			"Priest's": Color.crystalgreen,
			"Dragon's": Color.crystalblue,
			"Vulpine": Color.crystalblue,
			"Shimmering": Color.lightpurple,
			"Rainbow": Color.lightpurple,
			"Scintillating": Color.lightpurple,
			"Prismatic": Color.lightpurple,
			"Chromatic": Color.lightpurple,
			"Hierophant's": Color.crystalgreen,
			"Berserker's": Color.crystalgreen,
			"Necromancer's": Color.crystalgreen,
			"Witch-hunter's": Color.crystalgreen,
			"Arch-Angel's": Color.crystalgreen,
			"Valkyrie's": Color.crystalgreen,
			"Massive": Color.darkgold,
			"Savage": Color.darkgold,
			"Merciless": Color.darkgold,
			"Ferocious": Color.black,
			"Grinding": Color.white,
			"Cruel": Color.black,
			"Gold": Color.lightgold,
			"Platinum": Color.lightgold,
			"Meteoric": Color.lightgold,
			"Strange": Color.lightgold,
			"Weird": Color.lightgold,
			"Knight's": Color.darkgold,
			"Lord's": Color.darkgold,
			"Fool's": Color.white,
			"King's": Color.darkgold,
			//"Master's": Color.darkgold,
			"Elysian": Color.darkgold,
			"Fiery": Color.darkred,
			"Smoldering": Color.darkred,
			"Smoking": Color.darkred,
			"Flaming": Color.darkred,
			"Condensing": Color.darkred,
			"Septic": Color.darkgreen,
			"Foul": Color.darkgreen,
			"Corrosive": Color.darkgreen,
			"Toxic": Color.darkgreen,
			"Pestilent": Color.darkgreen,
			"of Quickness": Color.darkyellow,
			"of the Glacier": Color.darkblue,
			"of Winter": Color.darkblue,
			"of Burning": Color.darkred,
			"of Incineration": Color.darkred,
			"of Thunder": Color.darkyellow,
			"of Storms": Color.darkyellow,
			"of Carnage": Color.black,
			"of Slaughter": Color.black,
			"of Butchery": Color.black,
			"of Evisceration": Color.black,
			"of Performance": Color.black,
			"of Transcendence": Color.black,
			"of Pestilence": Color.darkgreen,
			"of Anthrax": Color.darkgreen,
			"of the Locust": Color.crystalred,
			"of the Lamprey": Color.crystalred,
			"of the Wraith": Color.crystalred,
			"of the Vampire": Color.crystalred,
			"of Icebolt": Color.lightblue,
			"of Nova": Color.crystalblue,
			"of the Mammoth": Color.crystalred,
			"of Frost Shield": Color.lightblue,
			"of Nova Shield": Color.crystalblue,
			"of Wealth": Color.lightgold,
			"of Fortune": Color.lightgold,
			"of Luck": Color.lightgold,
			"of Perfection": Color.darkgold,
			"of Regrowth": Color.crystalred,
			"of Spikes": Color.orange,
			"of Razors": Color.orange,
			"of Swords": Color.orange,
			"of Stability": Color.darkyellow,
			"of the Colosuss": Color.crystalred,
			"of the Squid": Color.crystalred,
			"of the Whale": Color.crystalred,
			"of Defiance": Color.darkred,
			"of the Titan": Color.darkgold,
			"of Atlas": Color.darkgold,
			"of Wizardry": Color.darkgold
		};

		switch (this.itemType) {
		case 15: // boots
			colors["of Precision"] = Color.darkgold;

			break;
		case 16: // gloves
			colors["of Alacrity"] = Color.darkyellow;
			colors["of the Leech"] = Color.crystalred;
			colors["of the Bat"] = Color.crystalred;
			colors["of the Giant"] = Color.darkgold;

			break;
		}
	} else if (this.quality === 5) { // Set
		if (this.getFlag(0x10)) {
			for (i = 0; i < 127; i += 1) {
				if (this.fname.split("\n").reverse()[0].indexOf(getLocaleString(getBaseStat(16, i, 3))) > -1) {
					return getBaseStat(16, i, 12) > 20 ? -1 : getBaseStat(16, i, 12);
				}
			}
		} else {
			return Color.lightyellow; // Unidentified set item
		}
	} else if (this.quality === 7) { // Unique
		for (i = 0; i < 401; i += 1) {
			if (this.code === getBaseStat(17, i, 4).replace(/^\s+|\s+$/g, "") && this.fname.split("\n").reverse()[0].indexOf(getLocaleString(getBaseStat(17, i, 2))) > -1) {
				return getBaseStat(17, i, 13) > 20 ? -1 : getBaseStat(17, i, 13);
			}
		}
	}

	for (i = 0; i < this.suffixes.length; i += 1) {
		if (colors.hasOwnProperty(this.suffixes[i])) {
			return colors[this.suffixes[i]];
		}
	}

	for (i = 0; i < this.prefixes.length; i += 1) {
		if (colors.hasOwnProperty(this.prefixes[i])) {
			return colors[this.prefixes[i]];
		}
	}

	return -1;
};

// Object.assign polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign !== 'function') {
	Object.defineProperty(Object, "assign", {
		value: function assign (target) {
			if (target === null) {
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource !== null) {
					for (var nextKey in nextSource) {
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}

			return to;
		},
		writable: true,
		configurable: true
	});
}

// Array.find polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
	Object.defineProperty(Array.prototype, 'find', {
		value: function (predicate) {
			if (this === null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			var len = o.length >>> 0;

			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			var thisArg = arguments[1];

			var k = 0;

			while (k < len) {
				var kValue = o[k];

				if (predicate.call(thisArg, kValue, k, o)) {
					return kValue;
				}

				k++;
			}

			return undefined;
		},
		configurable: true,
		writable: true
	});
}

/**
 * @description Return the first element or undefined
 * @return undefined|*
 */
if (!Array.prototype.first) {
	Array.prototype.first = function () {
		return this.length > 0 ? this[0] : undefined;
	};
}

/**
 * @description Return the items of a player, or an empty array
 * @param args
 * @returns Unit[]
 */
Unit.prototype.getItems = function (...args) {
	let item = this.getItem.apply(this, args), items = [];

	if (item) {
		do {
			items.push(copyUnit(item));
		} while (item.getNext());
		return items;
	}

	return [];
};

/**
 * @description Used upon item units like ArachnidMesh.castChargedSkill([skillId]) or directly on the "me" unit me.castChargedSkill(278);
 * @param {int} skillId = undefined
 * @param {int} x = undefined
 * @param {int} y = undefined
 * @return boolean
 * @throws Error
 */
Unit.prototype.castChargedSkill = function (...args) {
	let skillId, x, y, unit, chargedItem, charge,
		chargedItems = [],
		validCharge = function (itemCharge) {
			return itemCharge.skill === skillId && itemCharge.charges;
		};

	switch (args.length) {
	case 0: // item.castChargedSkill()
		break;
	case 1:
		if (args[0] instanceof Unit) { // hellfire.castChargedSkill(monster);
			unit = args[0];
		} else {
			skillId = args[0];
		}

		break;
	case 2:
		if (typeof args[0] === 'number') {
			if (args[1] instanceof Unit) { // me.castChargedSkill(skillId,unit)
				[skillId, unit] = [...args];
			} else if (typeof args[1] === 'number') { // item.castChargedSkill(x,y)
				[x, y] = [...args];
			}
		} else {
			throw new Error(' invalid arguments, expected (skillId, unit) or (x, y)');
		}

		break;
	case 3:
		// If all arguments are numbers
		if (typeof args[0] === 'number' && typeof args[1] === 'number' && typeof args[2] === 'number') {
			[skillId, x, y] = [...args];
		}

		break;
	default:
		throw new Error("invalid arguments, expected 'me' object or 'item' unit");
	}

	// Charged skills can only be casted on x, y coordinates
	unit && ([x, y] = [unit.x, unit.y]);

	if (this !== me && this.type === 4) {
		throw Error("invalid arguments, expected 'me' object or 'item' unit");
	}

	if (this === me) { // Called the function the unit, me.
		if (!skillId) {
			throw Error('Must supply skillId on me.castChargedSkill');
		}

		chargedItems = [];

		this.getItems(-1) // Item must be in inventory, or a charm in inventory
			.filter(item => item && (item.location === 1 || (item.location === 3 && item.itemType === 82)))
			.forEach(function (item) {
				let stats = item.getStat(-2);

				if (stats && typeof stats === 'object' && stats.hasOwnProperty(204)) {
					stats = stats[204].filter(validCharge);
					stats.length && chargedItems.push({
						charge: stats.first(),
						item: item
					});
				}
			});

		if (chargedItems.length === 0) {
			throw Error("Don't have the charged skill (" + skillId + "), or not enough charges");
		}

		chargedItem = chargedItems.sort((a, b) => a.charge.level - b.charge.level).first().item;

		return chargedItem.castChargedSkill.apply(chargedItem, args);
	} else if (this.type === 4) {
		charge = this.getStat(-2)[204]; // WARNING. Somehow this gives duplicates

		if (!charge) {
			throw Error('No charged skill on this item');
		}

		if (skillId) {
			charge = charge.filter(item => (skillId && item.skill === skillId) && !!item.charges); // Filter out all other charged skills
		} else if (charge.length > 1) {
			throw new Error('multiple charges on this item without a given skillId');
		}

		charge = charge.first();

		if (charge) {
			// Setting skill on hand
			const Config = require('Config');
			if (!Config.PacketCasting || Config.PacketCasting === 1 && skillId !== 54) {
				return Skill.cast(skillId, 0, x || me.x, y || me.y, this); // Non packet casting
			}

			// Packet casting
			sendPacket(1, 0x3c, 2, charge.skill, 1, 0x0, 1, 0x00, 4, this.gid);
			// No need for a delay, since its TCP, the server recv's the next statement always after the send cast skill packet

			// The result of "successfully" casted is different, so we cant wait for it here. We have to assume it worked
			sendPacket(1, 0x0C, 2, x || me.x, 2, y || me.y); // Cast the skill

			return true;
		}
	}

	return false;
};

PresetUnit.prototype.__defineGetter__('unit', function () {
	return getUnits(this.type, this.id).first();
});

/**
 * @param args
 * @returns {Unit[]}
 */
function getUnits(...args) {
	let units = [], unit = getUnit.apply(null, args);

	if (!unit) {
		return [];
	}
	do {
		units.push(copyUnit(unit));
	} while (unit.getNext());
	return units;
}
/**
 * Simple functionality to read the distance between you and an unit.
 * Example: getUnit(...).distance <-- gives the distance between you and the unit.
 */
Object.defineProperty(Unit.prototype, 'distance', {
	get: function() {
		return getDistance(me,this);
	}
});


// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
if (!Array.prototype.findIndex) {
	Object.defineProperty(Array.prototype, 'findIndex', {
		value: function (predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return k.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return k;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return -1.
			return -1;
		},
		configurable: true,
		writable: true
	});
}

PresetUnit.prototype.__defineGetter__('unit', function () {
	return getUnits(this.type, this.id).first();
});

String.prototype.lcsGraph = function (compareToThis) {
	if (!this.length || !compareToThis || !compareToThis.length) {
		return null;
	}

	let stringA = this.toString().toLowerCase(), stringB = compareToThis.toLowerCase(), graph = Array(this.length), x,
		y;
	let check = (i, j) => (i < 0 || j < 0 || i >= stringA.length || j >= stringB.length) ? 0 : graph[i][j];

	for (x = 0; x < stringA.length; x++) {
		graph[x] = new Uint16Array(stringB.length);

		for (y = 0; y < stringB.length; y++) {
			if (stringA[x] === stringB[y]) {
				graph[x][y] = check(x - 1, y - 1) + 1;
			} else {
				graph[x][y] = Math.max(check(x - 1, y), check(x, y - 1));
			}
		}
	}

	return {a: this.toString(), b: compareToThis, graph: graph};
};

String.prototype.diffCount = function (stringB) {
	try {
		if (typeof stringB !== 'string' || !stringB) {
			return this.length;
		}

		if (!this.length) {
			return stringB.length;
		}

		let graph = this.lcsGraph(stringB);

		return (Math.max(graph.a.length, graph.b.length) - graph.graph[graph.a.length - 1][graph.b.length - 1]);
	} catch (err) {
		print(err.stack);
	}

	return Infinity;
};

if (!String.prototype.includes) {
	String.prototype.includes = function (search, start) {
		'use strict';
		if (typeof start !== 'number') {
			start = 0;
		}

		if (start + search.length > this.length) {
			return false;
		} else {
			return this.indexOf(search, start) !== -1;
		}
	};
}

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1)
};

Array.prototype.isEqual = function (t) {
	return this.map((x, i) => t.hasOwnProperty(i) && x === t[i]).reduce((a, c) => c & a, true);
};


getScript.startAsThread = function () {
	let stack = new Error().stack.match(/[^\r\n]+/g),
		filename = stack[1].match(/.*?@.*?d2bs\\kolbot\\(.*):/)[1];

	if (getScript(true).name.toLowerCase() === filename.toLowerCase()) {
		return 'thread';
	}

	if (!getScript(filename)) {
		load(filename);
		return 'started';
	}

	return 'loaded';
};

Array.prototype.filterHighDistance = function () {
	const distances = this.map(
		(x, i) => this
			.filter((_, index) => index !== i) // Not this element
			.map(y => Math.abs(y - this[i])).reduce((a, c) => c + a || 0, 0) / (this.length - 1) // Avg of distance to others
	);
	const distancesAvg = distances.reduce((a, c) => c + a || 0, 0) / this.length;
	if (distancesAvg > 30) {
		return this.filter((x, i) => distances[i] < distancesAvg * 0.75);
	}
	return this; // Everything is relatively the same
};

// https://tc39.github.io/ecma262/#sec-array.prototype.findindex
if (!Array.prototype.findIndex) {
	Object.defineProperty(Array.prototype, 'findIndex', {
		value: function (predicate) {
			// 1. Let O be ? ToObject(this value).
			if (this == null) {
				throw new TypeError('"this" is null or not defined');
			}

			var o = Object(this);

			// 2. Let len be ? ToLength(? Get(O, "length")).
			var len = o.length >>> 0;

			// 3. If IsCallable(predicate) is false, throw a TypeError exception.
			if (typeof predicate !== 'function') {
				throw new TypeError('predicate must be a function');
			}

			// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
			var thisArg = arguments[1];

			// 5. Let k be 0.
			var k = 0;

			// 6. Repeat, while k < len
			while (k < len) {
				// a. Let Pk be ! ToString(k).
				// b. Let kValue be ? Get(O, Pk).
				// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
				// d. If testResult is true, return k.
				var kValue = o[k];
				if (predicate.call(thisArg, kValue, k, o)) {
					return k;
				}
				// e. Increase k by 1.
				k++;
			}

			// 7. Return -1.
			return -1;
		},
		configurable: true,
		writable: true
	});
}

String.prototype.startsWith = function (prefix) {
	return !prefix || this.substring(0, prefix.length) === prefix;
};

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function (search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
	Array.from = (function () {
		var toStr = Object.prototype.toString;
		var isCallable = function (fn) {
			return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
		};
		var toInteger = function (value) {
			var number = Number(value);
			if (isNaN(number)) { return 0; }
			if (number === 0 || !isFinite(number)) { return number; }
			return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
		};
		var maxSafeInteger = Math.pow(2, 53) - 1;
		var toLength = function (value) {
			var len = toInteger(value);
			return Math.min(Math.max(len, 0), maxSafeInteger);
		};

		// The length property of the from method is 1.
		return function from(arrayLike/*, mapFn, thisArg */) {
			// 1. Let C be the this value.
			var C = this;

			// 2. Let items be ToObject(arrayLike).
			var items = Object(arrayLike);

			// 3. ReturnIfAbrupt(items).
			if (arrayLike == null) {
				throw new TypeError('Array.from requires an array-like object - not null or undefined');
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
				// 5. else
				// 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
				if (!isCallable(mapFn)) {
					throw new TypeError('Array.from: when provided, the second argument must be a function');
				}

				// 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
				if (arguments.length > 2) {
					T = arguments[2];
				}
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = toLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method
			// of C with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… (also steps a - h)
			var kValue;
			while (k < len) {
				kValue = items[k];
				if (mapFn) {
					A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
				} else {
					A[k] = kValue;
				}
				k += 1;
			}
			// 18. Let putStatus be Put(A, "length", len, true).
			A.length = len;
			// 20. Return A.
			return A;
		};
	}());
}