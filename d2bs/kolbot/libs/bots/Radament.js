/**
*	@filename	Radament.js
*	@author		kolton
*	@desc		kill Radament
*/

function Radament(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();

	if (!me.journeyToPreset(49, 2, 355)) {
		throw new Error("Failed to move to Radament");
	}

	Attack.kill(229); // Radament
	Pickit.pickItems();
	Attack.openChests(20);
}