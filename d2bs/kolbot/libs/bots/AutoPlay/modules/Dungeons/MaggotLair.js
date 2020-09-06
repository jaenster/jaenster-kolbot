(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');
	const walkTo = require('../WalkTo');

	new CustomDungeon(sdk.areas.MaggotLairLvl3, function () {
		let poi = getPresetUnit(sdk.areas.MaggotLairLvl3, 2, 356).realCoords();
		walkTo(poi);
		me.getQuestItem(92, 356);
	});


})(module, require);