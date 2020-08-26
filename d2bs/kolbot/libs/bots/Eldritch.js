/**
 *    @filename    Eldritch.js
 *    @author      kolton
 *    @desc        kill Eldritch the Rectifier, optionally kill Shenk the Overseer, Dac Farren and open chest
 */

function Eldritch(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();
	Pather.useWaypoint(111);
	require('../modules/Precast').call();
	Pather.moveTo(3745, 5084);
	Attack.clear(15, 0, getLocaleString(22500)); // Eldritch the Rectifier

	if (Config.Eldritch.OpenChest) {
		let chest = getPresetUnit(me.area, 2, 455);

		if (chest) {
			Pather.moveToUnit(chest);

			chest = getUnit(2, 455);

			if (Misc.openChest(chest)) {
				Pickit.pickItems();
			}
		}
	}

	if (Config.Eldritch.KillShenk) {
		Pather.moveTo(3876, 5130);
		Attack.clear(15, 0, getLocaleString(22435)); // Shenk the Overseer
	}

	if (Config.Eldritch.KillDacFarren) {
		Pather.moveTo(4478, 5108);
		Attack.clear(15, 0, getLocaleString(22501)); // Dac Farren
	}

	return true;
}