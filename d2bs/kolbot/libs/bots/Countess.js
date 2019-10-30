/**
*	@filename	Countess.js
*	@author		kolton
*	@desc		kill The Countess and optionally kill Ghosts along the way
*/

function Countess(Config, Attack, Pickit, Pather, Town) {
	var i, poi;

	Town();

	if (!Pather.journeyTo(sdk.areas.TowerCellarLvl5)) {
		throw new Error("Failed to move to Countess");
	}

	poi = getPresetUnit(me.area, 2, 580);

	if (!poi) {
		throw new Error("Failed to move to Countess (preset not found)");
	}

	switch (poi.roomx * 5 + poi.x) {
	case 12565:
		Pather.moveTo(12578, 11043);
		break;
	case 12526:
		Pather.moveTo(12548, 11083);
		break;
	}
	delay(50);
	for (let i = 0; i < 5; i++) {
		try {
			getUnits(sdk.unittype.Monsters)
				.filter(x => x.name === getLocaleString(sdk.locale.monsters.TheCountess))
				.first()
				.kill();

			break;
		} catch (e) {
			delay(Math.max(100 * i, 100));
			// re-try 5 times
		}
	}

	if (Config.OpenChests) {
		Misc.openChestsInArea();
	}
}