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
			{x: 15089, y: 6294},
			{x: 15085, y: 6345},
			{x: 15030, y: 6302},
			{x: 15024, y: 6340},
		], false);
	});

	new CustomDungeon(sdk.areas.ForgottenTemple, function () {
		walkTo([
			{x: 15024, y: 6340},
			{x: 15108, y: 6929},
			{x: 15105, y: 6877},
			{x: 15061, y: 6879},
			{x: 15013, y: 6887},
			{x: 15017, y: 6937},
			{x: 15042, y: 6968},
		], false);
	});


	new CustomDungeon(sdk.areas.DisusedReliquary, function () {
		walkTo([
			{x: 15103, y:8163},
			{x: 15089, y:8207},
			{x: 15033, y:8203},
			{x: 15025, y:8149},
		], false);
	});

	new CustomDungeon(sdk.areas.RuinedFane, function () {
		walkTo([
			{x: 15020, y:7560},
			{x: 15046, y:7542},
			{x: 15044, y:7499},
			{x: 15079, y:7544},
		]);
	});


})(module, require);