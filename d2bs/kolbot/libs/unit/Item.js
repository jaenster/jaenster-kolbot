const clickItemAndWait = (...args) => {
	let before = !!me.itemoncursor,
		itemEvent = false,
		timeout = getTickCount(),
		gamePacket = bytes => bytes && bytes.length > 0 && bytes[0] === 0x9D /* item event*/ && (itemEvent = true) && false; // false to not block

	addEventListener('gamepacket', gamePacket);

	clickItem.apply(undefined, args);
	delay(Math.max(me.ping * 2, 50));

	while (!itemEvent) { // Wait until item is picked up.
		delay(3);

		if (before !== !!me.itemoncursor || getTickCount() - timeout > Math.min(1000, 100 + (me.ping * 4))) {
			break; // quit the loop of item on cursor has changed
		}
	}

	removeEventListener('gamepacket', gamePacket);
	delay(Math.max(me.ping, 50));
	itemEvent = false;
};

Unit.prototype.equip = function (destLocation = undefined) {
	const Storage = require('Storage');
	let doubleHanded = [26, 27, 34, 35, 67, 85, 86], spot, findspot = function (item) {
		let tempspot = Storage.Stash.FindSpot(item);

		if (getUIFlag(0x19) && tempspot) {
			return {location: Storage.Stash.location, coord: tempspot};
		}

		tempspot = Storage.Inventory.FindSpot(item);

		if (tempspot) {
			return {location: Storage.Inventory.location, coord: tempspot};
		}

		return false; // no spot found
	};

	// Not an item, or unidentified, or not enough stats
	if (this.type !== 4 || !this.getFlag(0x10) || this.getStat(92) > me.getStat(12) || this.dexreq > me.getStat(2) || this.strreq > me.getStat(0)) {
		return false;
	}

	// If not a specific location is given, figure it out (can be useful to equip a double weapon)
	(destLocation || (destLocation = this.getBodyLoc())) && !Array.isArray(destLocation) && (destLocation = [destLocation]);

	print('equiping ' + this.name);

	if (this.location === 1) {
		return true; // Item is equiped
	}


	let currentEquiped = me.getItems(-1).filter(item =>
		destLocation.indexOf(item.bodylocation) !== -1
		|| ( // Deal with double handed weapons

			(item.bodylocation === 4 || item.bodylocation === 5)
			&& [4, 5].indexOf(destLocation) // in case destination is on the weapon/shield slot
			&& (
				doubleHanded.indexOf(this.itemType) !== -1 // this item is a double handed item
				|| doubleHanded.indexOf(item.itemType) !== -1 // current item is a double handed item
			)
		)
	).sort((a, b) => b - a); // shields first

	// if nothing is equipped at the moment, just equip it
	if (!currentEquiped.length) {
		clickItemAndWait(0, this);
		clickItemAndWait(0, destLocation.first());
	} else { // unequip / swap items
		currentEquiped.forEach((item, index) => {

			// Last item, so swap instead of putting off first
			if (index === (currentEquiped.length - 1)) {
				print('swap ' + this.name + ' for ' + item.name);
				let oldLoc = {x: this.x, y: this.y, location: this.location};
				clickItemAndWait(0, this); // Pick up current item
				clickItemAndWait(0, destLocation.first()); // the swap of items
				// Find a spot for the current item
				spot = findspot(item);

				if (!spot) { // If no spot is found for the item, rollback
					clickItemAndWait(0, destLocation.first()); // swap again
					clickItemAndWait(0, oldLoc.x, oldLoc.y, oldLoc.location); // put item back on old spot
					throw Error('cant find spot for unequipped item');
				}

				clickItemAndWait(0, spot.coord.y, spot.coord.x, spot.location); // put item on the found spot

				return;
			}

			print('Unequip item first ' + item.name);
			// Incase multiple items are equipped
			spot = findspot(item); // Find a spot for the current item

			if (!spot) {
				throw Error('cant find spot for unequipped item');
			}

			clickItemAndWait(0, item.bodylocation);
			clickItemAndWait(0, spot.coord.x, spot.coord.y, spot.location);
		});
	}

	return {
		success: this.bodylocation === destLocation.first(),
		unequiped: currentEquiped,
		rollback: () => currentEquiped.forEach(item => item.equip()) // Note; rollback only works if you had other items equipped before.
	};
};

Unit.prototype.getBodyLoc = function () {
	let types = {
		1: [37, 71, 75], // helm
		2: [12], // amulet
		3: [3], // armor
		4: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 42, 43, 44, 67, 68, 69, 72, 85, 86, 87, 88], // weapons
		5: [2, 5, 6, 70], // shields / Arrows / bolts
		6: [10], // ring slot 1
		7: [10], // ring slot 2
		8: [19], // belt
		9: [15], // boots
		10: [16], // gloves
	}, bodyLoc = [];

	for (let i in types) {
		this.itemType && types[i].indexOf(this.itemType) !== -1 && bodyLoc.push(i);
	}

	return bodyLoc.map(loc => parseInt(loc));
};