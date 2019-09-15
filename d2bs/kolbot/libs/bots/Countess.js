/**
*	@filename	Countess.js
*	@author		kolton
*	@desc		kill The Countess and optionally kill Ghosts along the way
*/

function Countess(Config, Attack) {
	var i, poi;

	Town.doChores();

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

	getUnits(1).filter(x => x.name === getLocaleString(2875)).kill();

	if (Config.OpenChests) {
		Misc.openChestsInArea();
	}
}