(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const walkTo = require('../WalkTo');
	const Misc = require('../../../../modules/Misc');
	const Pather = require('../../../../modules/Pather');
	const Pickit = require('../../../../modules/Pickit');

	// const FastestPath = require('../FastestPath');

	new CustomDungeon(sdk.areas.RuinedTemple, function () {
		const ps = getPresetUnit(sdk.areas.RuinedTemple, 2, sdk.units.LamEsensTome);

		walkTo(ps, false);

		if (!me.getQuest(sdk.quests.LamEsensTome, 0)) {
			const LamEsen = ps.unit;
			Misc.poll(() => {
				LamEsen.click();
				return LamEsen.mode;
			});
			Pickit.pickItems();
		}

	});

	//ToDo; figure out if its a static map
	new CustomDungeon(sdk.areas.DisusedFane, function () {
		walkTo([
			{x: 15024, y: 5640},
			{x: 15025, y: 5692},
			{x: 15059, y: 5695},
			{x: 15097, y: 5704},
			{x: 15082, y: 5673},
			{x: 15057, y: 5634},
		], false);
	});

	new CustomDungeon(sdk.areas.ForgottenReliquary, function () {
		walkTo([
			{x: 15089, y: 6294},
			{x: 15085, y: 6345},
			{x: 15030, y: 6302},
			{x: 15024, y: 6340},
		], false);
	});


	const chestIds = [5, 6, 87, 104, 105, 106, 107, 143, 140, 141, 144, 146, 147, 148, 176, 177, 181, 183, 198, 240, 241, 242, 243, 329, 330, 331, 332, 333, 334, 335, 336, 354, 355, 356, 371, 387, 389, 390, 391, 397, 405, 406, 407, 413, 420, 424, 425, 430, 431, 432, 433, 454, 455, 501, 502, 504, 505, 580, 581];

	const getAllChestsAndSort = () => getPresetUnits(me.area)
		.filter(ps => (chestIds.includes(ps.id)))
		.map(ps => {
			const coords = ps.realCoords();
			coords.d = Pather.getWalkDistance(coords.x, coords.y);
			return coords;
		})
		.sort((a, b) => (a.d - b.d));

	new CustomDungeon(sdk.areas.ForgottenTemple, function () {

		walkTo(getAllChestsAndSort(), false);
	});


	new CustomDungeon(sdk.areas.RuinedFane, function () {

		let room = getRoom(), coords = [],  result;
		console.debug(room);
		if (room) do {
			result = Pather.getNearestWalkable(room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2, room.xsize, 3, 0x1 | 0x4 | 0x800 | 0x1000);
			if (result) {
				let [x,y] = result;
				coords.push({x:x,y:y});
			}
		} while(room.getNext()); else throw Error('Room not found');


		coords.map(coord => ({
			x: coord.x,
			y: coord.y,
			d: Pather.getWalkDistance(coord.x, coord.y),
		})).sort((a, b) => (a.d - b.d));

		walkTo(coords, false);
	});

	new CustomDungeon(sdk.areas.DisusedReliquary, function () {
		walkTo([
			{x: 15103, y: 8163},
			{x: 15089, y: 8207},
			{x: 15033, y: 8203},
			{x: 15025, y: 8149},
		], false);
	});


})(module, require);