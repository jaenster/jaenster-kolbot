/**
 *    @filename    Mephisto.js
 *    @author      kolton, njomnjomnjom, jaenster
 *    @desc        kill Mephisto
 */

module.exports = function (Config, Attack, Pickit, Pather, Town) {
	const TownPrecast = require('TownPrecast');
	this.killMephisto = function () {
		const meph = getUnit(1, sdk.monsters.Mephisto);

		if (!meph) {
			throw new Error("Mephisto not found!");
		}

		meph.kill();

		return meph.dead;
	};

	TownPrecast();
	if (!Pather.journeyTo(102)) {
		throw new Error("Failed to move to Durance Level 3");
	}

	if (Config.Mephisto.TakeRedPortal) {
		Pather.moveTo(17590, 8068); // Save time and activate the river bank
		delay(400);
	}
	Pather.moveTo(17566, 8069);
	this.killMephisto();
	Pickit.pickItems();

	if (Config.OpenChests) {
		Pather.moveTo(17572, 8011);
		Attack.openChests(5);
		Pather.moveTo(17572, 8125);
		Attack.openChests(5);
		Pather.moveTo(17515, 8061);
		Attack.openChests(5);
	}

	if (Config.Mephisto.TakeRedPortal) {
		// bridge not activated yet?
		if (getCollision(me.area, 17601, 8070, 17590, 8068) !== 0) Pather.moveTo(17590, 8068); // so activate

		let tick = getTickCount(), time = 0;
		while (getCollision(me.area, 17601, 8070, 17590, 8068) !== 0) {
			delay(3);
			if ((time = getTickCount() - tick > 1500)) break;
		}
		if (time > 2000) { // somehow failed
			Town.goToTown();
		} else {
			Pather.moveTo(17601, 8070);
			Pather.usePortal(null);
		}
	}
};
