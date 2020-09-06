(function (module, require) {

	const CustomDungeon = require('../CustomDungeon');

	new CustomDungeon(sdk.areas.TowerCellarLvl5, function(walkTo) {

		// cunt-ress pwnage
		let poi = getPresetUnit(me.area, 2, 580);

		if (!poi) return false;
		let target = {x: 12578, y: 11043};

		if (poi.roomx * 5 + poi.x === 12526) target = {x: 12548, y: 11083};

		walkTo(target);

		const cuntress = getUnits(2).filter(unit => unit.name === getLocaleString(2875)).first();

		cuntress.clear(20);
		cuntress.kill();
	});


})(module, require);