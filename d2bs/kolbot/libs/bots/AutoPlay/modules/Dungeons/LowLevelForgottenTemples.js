(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const walkTo = require('../WalkTo');
	const Misc = require('../../../../modules/Misc');
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


})(module, require);