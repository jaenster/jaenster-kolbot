/**
*	@filename	CloneKilla.js
*	@author		kolton
*	@desc		Kill Diablo Clone when he walks in game. Uses Fire Eye location.
*/


include('require.js');
include("OOG.js");
include("AutoMule.js");
include("craftingsystem.js");
include("Gambling.js");
include("TorchSystem.js");
include("MuleLogger.js");

include("common/Cubing.js");
include("common/Pather.js");

include("common/Prototypes.js");
include("common/Runewords.js");


// ToDo; looking at the script, it seems to not work with this kolton version. Needs fixing?

function main() {
	D2Bot.init();

	CraftingSystem.buildLists();
	include("bots/KillDclone.js");
	if (typeof KillDclone === "function") {
		try {
			D2Bot.printToConsole("Trying to kill DClone.", 7);
			KillDclone.apply(KillDclone, ['Config', 'Attack', 'Pickit', 'Pather', 'Town'].map(x => require(x)));
		} catch (e) {
			Misc.errorReport(e, "CloneKilla.js");
		}
	}

	quit();

	return true;
}