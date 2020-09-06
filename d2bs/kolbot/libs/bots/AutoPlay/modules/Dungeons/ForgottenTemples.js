(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const walkTo = require('../WalkTo');
	const Misc = require('../../../../modules/Misc');
	const Pickit = require('../../../../modules/Pickit');

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
			15089, 6294,
			15085, 6345,
			15030, 6302,
			15024, 6340,
		], false);
	});

	new CustomDungeon(sdk.areas.ForgottenTemple, function () {
		walkTo([
			15024, 6340,
			15108, 6929,
			15105, 6877,
			15061, 6879,
			15013, 6887,
			15017, 6937,
			15042, 6968,
		], false);
	});


	new CustomDungeon(sdk.areas.DisusedReliquary, function () {
		walkTo([
			15103,8163,
			15089,8207,
			15033,8203,
			15025,8149,
		], false);
	});

	new CustomDungeon(sdk.areas.RuinedFane, function () {
		walkTo([
			15020,7560,
			15046,7542,
			15044,7499,
			15079,7544,
		]);
	});


})(module, require);