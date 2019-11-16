/**
 *    @filename    Cows.js
 *    @author        kolton, jaenster
 *    @desc        clear the Moo Moo Farm without killing the Cow King
 */

function Cows(Config, Attack, Pickit, Pather, Town, Misc) {
	this.buildCowRooms = function () {
		var i, j, room, kingPreset, badRooms, badRooms2,
			finalRooms = [],
			indexes = [];

		kingPreset = getPresetUnit(me.area, 1, 773);
		badRooms = getRoom(kingPreset.roomx * 5 + kingPreset.x, kingPreset.roomy * 5 + kingPreset.y).getNearby();

		for (i = 0; i < badRooms.length; i += 1) {
			badRooms2 = badRooms[i].getNearby();

			for (j = 0; j < badRooms2.length; j += 1) {
				if (indexes.indexOf(badRooms2[j].x + "" + badRooms2[j].y) === -1) {
					indexes.push(badRooms2[j].x + "" + badRooms2[j].y);
				}
			}
		}

		room = getRoom();

		do {
			if (indexes.indexOf(room.x + "" + room.y) === -1) {
				finalRooms.push([room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2]);
			}
		} while (room.getNext());

		return finalRooms;
	};

	this.clearCowLevel = function () {
		if (Config.MFLeader) {
			Pather.makePortal();
			say("cows");
		}

		let room, result, myRoom,
			rooms = this.buildCowRooms();

		const RoomSort = (a, b) => getDistance(myRoom[0], myRoom[1], a[0], a[1]) - getDistance(myRoom[0], myRoom[1], b[0], b[1]);

		while (rooms.length > 0) {
			// get the first room + initialize myRoom var
			if (!myRoom) {
				room = getRoom(me.x, me.y);
			}

			if (room) {
				if (room instanceof Array) { // use previous room to calculate distance
					myRoom = [room[0], room[1]];
				} else { // create a new room to calculate distance (first room, done only once)
					myRoom = [room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2];
				}
			}

			rooms.sort(RoomSort);
			room = rooms.shift();

			result = Pather.getNearestWalkable(room[0], room[1], 10, 2);

			if (result) {
				Pather.moveTo(result[0], result[1], 3);

				if (!Attack.clear(30)) {
					return false;
				}
			}
		}

		return true;
	};
	let leg, tome;

	{ // error handeling
		// we can begin now
		if (me.getQuest(4, 10)) { // king dead or cain not saved
			throw new Error("Already killed the Cow King.");
		}

		if (!me.getQuest(4, 0)) {
			throw new Error("Cain quest incomplete");
		}

		switch (me.gametype) {
			case 0: // classic
				if (!me.getQuest(26, 0)) { // diablo not completed
					throw new Error("Diablo quest incomplete.");
				}

				break;
			case 1: // expansion
				if (!me.getQuest(40, 0)) { // baal not completed
					throw new Error("Baal quest incomplete.");
				}

				break;
		}
	}

	const buffers = [{
		location: sdk.storage.Stash,
		buffer: [],
		y: me.gametype === 0 ? 4 : 8,
		x: 10,
	}, {
		location: sdk.storage.Inventory,
		buffer: [],
		y: 4,
		x: 10,
	}];

	const createArray = function (amount, defaultVal) {
		const arr = [];
		while (arr.length < amount + 1) arr.push(defaultVal);
		return arr;
	};
	const resetBuffers = () => buffers.forEach(buffer => {
		// Create a inverse of an inventory
		const grid = createArray(buffer.x, 1).map(() => createArray(buffer.y, 1)); // Everything starts with unlocked <-- WARNING

		me.getItems()
			.filter(item => item.location === buffer.location).forEach(
			function (item) {
				for (let extraX = 0; extraX < item.sizex; extraX++) {
					for (let extraY = 0; extraY < item.sizey; extraY++) {
						// Note that the y is what we call x, and y is in opposite order in the game
						grid[item.x + extraX][item.y + extraY] = 0; // This slot is locked
					}
				}
			});

		let flipped = grid.map((col, i) => grid.map(row => row.hasOwnProperty(i) && row[i]));
		flipped.length = buffer.y; // fix the length
		flipped.forEach((e, i) => buffer.buffer[i] = e);

	});
	resetBuffers();

	const canFitTome = function (buffer) {
		//Make sure it's a valid item
		if (!this || !(this instanceof Unit) || this.type !== sdk.unittype.Item) {
			return false;
		}
		let x, y, nx, ny, spots = 0;

		//Loop buffer looking for spot to place this.
		for (y = 0; y < buffer.x; y += 1) {
			for (x = 0; x < buffer.y; x += 1) {
				//Check if there is something in this spot.
				if (buffer.buffer[x][y] > 0) continue;

				if ((() => {
					//Loop the this size to make sure we can fit it.
					for (nx = 0; nx < 2; nx += 1) {
						for (ny = 0; ny < 2; ny += 1) {
							if (buffer.buffer[x + nx][y + ny]) {
								return true;
							}
						}
					}
					return false;
				}).call()) {
					continue; // not a valid spot
				}
				for (nx = 0; nx < 2; nx += 1) {
					for (ny = 0; ny < 2; ny += 1) {
						buffer.buffer[x + nx][y + ny] = 1; // Locked from now on
					}
				}
				spots++;
			}
		}

		return spots;
	};
	const Storage = require('Storage');
	const books = me.getItems().filter(x => x.code === "tbk");
	const cube = me.getItem(549);
	require('Debug');

	//ToDo; dont open cube if we already know its empty
	print('ensure cube is empty');
	Cubing.openCube();
	Cubing.emptyCube(); // ensure cube is empty
	Object.keys(sdk.uiflags).forEach(x => me.cancel());
	delay(1000);
	require('Config').PacketShopping = false;
	if (books.length < 2) {
		let hadBook = books.length;
		// Buy books
		Town.goToTown(3); // its easier to buy books in act 3, and move to stash.

		print('have a book? put it in in cube');
		Town.openStash();
		delay(1000);
		// we have 1 tome..
		if (hadBook) {
			books[0].toCursor();
			sendPacket(1, 0x2A, 4, books[0].gid, 4, cube.gid); // move tome we have to cube
		}

		const Ormus = Town.initNPC("Shop");
		if (!Ormus) throw Error('failed to open shop');

		delay(500); // wait for items to appear
		let vendorBook = Ormus.getItem("tbk");

		// Calculate how much vendor books fit in inventory
		const buyMax = Math.min.apply(Math, buffers.map(buff => canFitTome.apply(vendorBook, [buff])));

		const amount = Math.min(buyMax, 3);
		print(amount);

		// Since we are here anyway
		Town.buyPotions();
		Town.buyKeys();
		Town.identify();

		for (let i = 0; i < amount + books.length; i++) vendorBook.buy();

		Town.openStash();
		const newBooks = me.getItems().filter(i => i.code === 'tbk').filter(i => i.location === sdk.storage.Inventory).reverse(); // oldest book last (yeah, tricky shit i know)
		newBooks.length = amount; // dont move the main book to storage

		// If we didnt start out with a book, there isnt one in the cube it at the moment
		if (!hadBook) {
			let first = newBooks.shift().gid;
			first.toCursor();
			sendPacket(1, 0x2A, 4, first, 4, cube.gid);
		}


		// move new books to stash
		newBooks.forEach(newBook => Storage.Stash.MoveTo(newBook) && delay(1000));
	}
	Town.heal(); // To be sure
	if (!(leg = me.getItems().filter(x => x.classid === 88).first())) {
		Pather.journeyTo(sdk.areas.StonyField);
		Pather.moveToPreset(sdk.areas.StonyField, 1, 737, 0, 0, false, true);
		let portal;
		for (let i = 0; i < 300 && !(portal = Pather.getPortal(38)); i += 1) delay(10);
		Pather.usePortal(null, null, portal);
		Pather.moveTo(25048, 5177);

		// If we dont have a leg, get it
		let wirt = getUnit(2, 268);

		for (let i = 0; i < 40; i += 1) {
			wirt.interact();
			delay(10);

			leg = getUnit(4, 88);

			if (leg) {
				let gid = leg.gid;

				Pickit.pickItem(leg);
				Town.goToTown();

				leg = me.getItem(-1, -1, gid);
				break;
			}
		}
	}
	Town.move('stash');
	Town.openStash();
	if (books.length > 1 && !me.getItems().filter(x => x.location === sdk.locations.cube).filter(x => x.code === 'tbk').first()) {
		let tome = me.getItems().filter(x => x.code === "tbk").filter(x => x.location !== sdk.locations.cube).sort((a, b) => b.location - a.location).first();
		// 2a [DWORD item id] [DWORD cube id]
		print('tome to cube');
		tome.toCursor();
		sendPacket(1, 0x2A, 4, tome.gid, 4, cube.gid);
		while (me.itemoncursor) delay(10);
	}
	// put leg in cube
	print('put leg in cube');
	leg.toCursor();
	sendPacket(1, 0x2A, 4, leg.gid, 4, cube.gid);
	while (me.itemoncursor) delay(10);
	print('open cube');
	Cubing.openCube();
	delay(500);
	me.getItems();
	transmute();
	Object.keys(sdk.uiflags).forEach(x => me.cancel());


	Pather.usePortal(39);

	let cowDone = false;

	const Promise = require('Promise');
	new Promise(resolve => {
		const king = getUnits(sdk.unittype.Monsters) // Get all monsters
			.filter(x => x.name === getLocaleString(sdk.locale.monsters.TheCowKing)) // get those named cow king
			.first(); // get the first

		if (king && king.distance < 80) { // if found and relativly in our location
			resolve(king);
		}
	}).then(king => {
		Town.goToTown();
		throw new Error('King found, aborting');
	});


	require('Precast')();
	this.clearCowLevel();

	return true;
}