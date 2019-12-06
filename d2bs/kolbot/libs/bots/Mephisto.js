/**
 *    @filename    Mephisto.js
 *    @author      kolton, njomnjomnjom, jaenster
 *    @desc        kill Mephisto
 */

module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
	const TownPrecast = require('TownPrecast');
	const GameData = require('GameData');
	const Skills = require('Skills');

	this.killMephisto = function () {
		const meph = getUnit(1, sdk.monsters.Mephisto);

		if (!meph) {
			throw new Error("Mephisto not found!");
		}

		meph.kill();

		return meph.dead;
	};

	TownPrecast();
	Town();
	if (!Pather.journeyTo(sdk.areas.DuranceOfHateLvl3)) {
		throw new Error("Failed to move to Durance Level 3");
	}

	if (Config.Mephisto.TakeRedPortal) {
		Pather.moveTo(17590, 8068); // Save time and activate the river bank
		delay(400);
	}
	let skillChoice = GameData.monsterEffort(sdk.monsters.Mephisto, sdk.areas.DuranceOfHateLvl3);

	// If we wanna cast a skill on long range, we might as well do the moat trick
	// But only if it takes us a while to kill meph
	if (Skills.range[skillChoice.skill] >= 20 && skillChoice.effort > 5) {
		// Get in range
		me.moveTo(17588, 8069);

		// Get meph's attention
		delay(300);

		const meph = getUnit(1, sdk.monsters.Mephisto);

		// Pull him away
		Pather.moveTo(17566, 8069);
		delay(500);

		let skillChoice = GameData.monsterEffort(meph, sdk.areas.DuranceOfHateLvl3);

		// Move away more
		Pather.moveTo(17584, 8082);
		if (skillChoice.skill === sdk.skills.StaticField) {
			Pather.teleportTo(17584, 8080); // my merc can attack meph, we want him near me
			while (meph.distance/3*2 > Skills.range[sdk.skills.StaticField]) {
				delay(30);
			}
			[0,0,0,0,0].forEach(() => me.cast(sdk.skills.StaticField));
		}
		while (meph.distance > 20) delay(3);

		//Relay
		Pather.moveTo(17597, 8090);
		while (meph.distance > 20) delay(3);

		// Move to the actual kill position
		Pather.moveTo(17608, 8094);
		while(!meph.dead) {
			const attack = GameData.monsterEffort(meph, sdk.areas.DuranceOfHateLvl3,undefined,undefined,undefined,true);
			meph.cast(attack.first().skill)
		}
	} else {
		Pather.moveTo(17566, 8069);
		this.killMephisto();
	}
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
