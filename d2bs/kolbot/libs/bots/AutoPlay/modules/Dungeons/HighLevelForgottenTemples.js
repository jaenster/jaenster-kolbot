(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const walkTo = require('../WalkTo');
	const Pather = require('../../../../modules/Pather');

	// const FastestPath = require('../FastestPath');

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