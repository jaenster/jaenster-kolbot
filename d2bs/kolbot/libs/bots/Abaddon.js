/**
*	@filename	Abaddon.js
*	@author		kolton
*	@desc		clear Abaddon
*/

function Abaddon(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();

	if (!me.journeyToPreset(sdk.areas.FrigidHighlands, sdk.unittype.Objects, sdk.units.RedPortal) || !Pather.usePortal(125)) {
		throw new Error("Failed to move to Abaddon");
	}

	Attack.clearLevel(Config.ClearType);
}