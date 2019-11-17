/**
 *    @filename    Sharptooth.js
 *    @author      loshmi
 *    @desc        kill Thresh Socket
 */

function SharpTooth(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();

	if (!me.journeyToPreset(111, 1, 790)) {
		throw new Error("Failed to move to Sharptooth Slayer");
	}

	Attack.kill(getLocaleString(22493)); // Sharptooth Slayer
	Pickit.pickItems();
}