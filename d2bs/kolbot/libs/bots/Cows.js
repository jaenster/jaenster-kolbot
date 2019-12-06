/**
 *    @filename    Cows.js
 *    @author       jaenster
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

		// get cube if needed
		if (!me.cube) {
			me.journeyToPreset(sdk.areas.HallsOfDeadLvl3, 2, 354, 0, 0, false, false);
			const chest = getUnit(2, 354);
			Misc.openChest(chest);
			let cube, tick = getTickCount();
			while (!(cube = getUnit(4, 549))) {
				delay(3);
				if (getTickCount() - tick > 1e3) break;
			}
			if (!cube) throw Error('Failed to fetch cube');
			Pickit.pickItem(cube);
		}
	}

	Town(); // Shop, buy crap

	me.journeyToPreset(sdk.areas.StonyField, 1, 737/*what is this ?*/, 0, 0, false, true);

	// Aslong we cant use the portal, we attack a bit
	/** @type Unit */
	let time = 0;
	while (me.area !== sdk.areas.Tristram) {
		let portal = Pather.getPortal(sdk.areas.Tristram);
		time++;
		if (portal) {
			!!(time % 2) && me.area !== sdk.areas.Tristram && portal.clear(5, 0x00, true);
			portal.moveTo();
			portal.interact();
		} else {
			delay(4);
		}
	}

	if (me.area !== sdk.areas.Tristram) {
		throw new Error('Failed to move to Tristram');
	}

	// Move to leg
	Pather.moveTo(25048, 5177);

	// get the stupid leg
	const wirt = getUnit(2, 268);

	for (let i = 0, leg,gid; i < 8; i += 1) {
		wirt.interact();
		delay(500);
		if ((leg = getUnit(4, 88))) {
			gid = leg.gid;
			Pickit.pickItem(leg);
			break;
		}
	}

	Town.goToTown();
	Town.openStash(); // still in stash

	//Todo; deal with an non empty cube
	clickItemAndWait(0,me.getItem(88));
	clickItemAndWait(0,me.cube); // While having the leg in our hands, click on the cube

	// got tome?
	clickItemAndWait(0,me.getItem(518));
	clickItemAndWait(0, me.cube);

	// We have nothing in our hands, so we can right click on the cube
	clickItemAndWait(1, me.cube);
	while(!getUIFlag(sdk.uiflags.Cube)) delay(1);

	transmute(); // We got the magic in it

	// close everything we have open
	while([sdk.uiflags.Cube,sdk.uiflags.Stash,sdk.uiflags.Iventory].filter(i=>getUIFlag(i)).map(i=>me.cancel()).length) delay(3);

	// Buy another tome.
	Town();

	Town.moveToSpot('stash');
	Pather.usePortal(sdk.areas.MooMooFarm);


	const Promise = require('Promise');
	let done = false;
	new Promise((resolve,reject) => {
		if (done) reject(); // Done with cows so done looking for king
		const king = getUnits(sdk.unittype.Monsters) // Get all monsters
			.filter(x => x.name === getLocaleString(sdk.locale.monsters.TheCowKing)) // get those named cow king
			.first(); // get the first

		if (king && king.distance < 80) { // if found and relativly in our location
			resolve(king);
		}
	}).then(king => {
		Town.goToTown();
		print('King in the neighbourhood, aborting');
		throw new Error('King found, aborting');
	}).catch(() => {
		print('Stop looking for king, as we stopped running cows')
	});


	require('Precast')();
	this.clearCowLevel();

	return done = true;
}