/**
*	@filename	Tombs.js
*	@author		kolton
*	@desc		clear Tal Rasha's Tombs
*/

function Tombs(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();
	Pather.journeyTo(46);

	for (let i = 66; i <= 72; i += 1) {
		if (!Pather.moveToExit(i, true)) {
			throw new Error("Failed to move to tomb");
		}

		Attack.clearLevel(Config.ClearType);

		if (!Pather.moveToExit(46, true)) {
			throw new Error("Failed to move to Canyon");
		}
	}

	return true;
}