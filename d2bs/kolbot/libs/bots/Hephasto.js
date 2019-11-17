/**
*	@filename	Hephasto.js
*	@author		kolton
*	@desc		kill Hephasto the Armorer
*/

function Hephasto(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();

	if (!me.journeyToPreset(107, 2, 376)) {
		throw new Error("Failed to move to Hephasto");
	}

	Attack.kill(getLocaleString(1067)); // Hephasto The Armorer
	Pickit.pickItems();

	return true;
}