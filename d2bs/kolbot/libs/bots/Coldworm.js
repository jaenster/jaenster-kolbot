/**
 *	@filename	Coldworm.js
 *	@author		kolton, edited by 13ack.Stab, jaenster
 *	@desc		kill Coldworm; optionally kill Beetleburst and clear Maggot Lair
 */

module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
	Town();
	Pather.useWaypoint(43);

	// Beetleburst, added by 13ack.Stab
	if (Config.Coldworm.KillBeetleburst) {
		if (!Pather.moveToPreset(me.area, 1, 747)) {
			throw new Error("Failed to move to Beetleburst");
		}

		Attack.clear(15, 0, getLocaleString(2882));
	}

	if (!Pather.journeyTo(sdk.areas.MaggotLairLvl3)) {
		throw new Error("Failed to move to Coldworm");
	}

	if (Config.Coldworm.ClearMaggotLair) {
		Attack.clearLevel(Config.ClearType);
	}


	if (!Config.Coldworm.ClearMaggotLair) {
		if (!Pather.moveToPreset(me.area, 2, 356)) {
			throw new Error("Failed to move to Coldworm");
		}

		Attack.clear(15, 0, 284);
	}

	return true;
};
