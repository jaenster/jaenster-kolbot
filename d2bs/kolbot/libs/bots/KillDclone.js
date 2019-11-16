/**
*	@filename	KillDclone.js
*	@author		kolton
*	@desc		Got to Palace Cellar level 3 and kill Diablo Clone.
*/

function KillDclone(Config, Attack, Pickit, Pather, Town, Misc) {
	Pather.useWaypoint(74);
	require('Precast').call();

	if (!Pather.usePortal(null)) {
		throw new Error("Failed to move to Palace Cellar");
	}

	Attack.kill(333);
	Pickit.pickItems();

	return true;
}