(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');

	new CustomDungeon(sdk.areas.MaggotLairLvl3, function (walkTo) {
		let poi = getPresetUnit(sdk.areas.MaggotLairLvl3, 2, 356).realCoords();
		walkTo(poi);
		me.getQuestItem(92, 356);
	});


})(module, require);