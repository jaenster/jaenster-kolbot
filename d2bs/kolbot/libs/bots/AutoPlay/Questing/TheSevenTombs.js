(function (module, require) {
	const NPC = require('../../../modules/NPC');
	const QuestData = require('../../../modules/QuestData');

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {

		const log = QuestData.fetchQuestArray(quest);

		if (me.act === 2 && me.area === sdk.areas.LutGholein) {
			const portal = getUnits(2,59).filter(portal => portal && portal.objtype > sdk.areas.AncientTunnels && portal.objtype < sdk.areas.DurielsLair).first();
			print(portal && portal.toSource());
			portal && portal.cast(sdk.skills.Telekinesis);
		}

		// if we aren't within the 7 tomes
		if (!(me.area > sdk.areas.AncientTunnels && me.area < sdk.areas.DurielsLair)) {
			Pather.useWaypoint(sdk.areas.CanyonOfMagi);
			let tombID = getRoom().correcttomb;
			Pather.moveToExit(tombID,true);

			// Move to spot we want
			Pather.moveToPreset(me.area, 2, 152, 0, 0);
		}


			const hole = Misc.poll(() => getUnit(2, 100),4000,20);
			hole.cast(sdk.skills.Telekinesis);

		if (!Misc.poll(() => me.area === sdk.areas.DurielsLair,4000,3)) {
			throw new Error('failed to go to DurielsLair');
		}

		// pwn that bitch
		try {
			getUnit(1, 211).kill();
		} catch(e) {
			Misc.errorReport(e,'Duriel may be already dead');
		}


		// go and talk with tyreal, this path should be teleportable
		Pather.walkTo(22621,15711);
		Pather.moveTo(22602,15705);
		Pather.moveTo(22579,15704);
		Pather.moveTo(22575,15675);
		Pather.moveTo(22579,15655);
		Pather.walkTo(22578,15642); // walk trough door
		Pather.moveTo(22578,15618);
		Pather.moveTo(22576,15591); // tyreal

		let unit = getUnit(1, "tyrael");
		if (getDistance(me, unit) > 3) {
			Pather.moveToUnit(unit);
		}

		unit.interact();
		me.cancel();
		me.cancel();
		sendPacket(1, 0x40);
		delay((me.ping||0) * 2 + 200);

		{
			let portal = Pather.getPortal(sdk.areas.LutGholein);
			portal && Pather.usePortal(null, null, portal) || Pather.makePortal(true);

			Town.move("palace");
			unit = getUnit(1, "jerhyn");
			if (unit) {
				unit.openMenu();
				me.cancel();
				me.cancel();
			}


			if (me.act === 2 && me.area === sdk.areas.LutGholein) {
				if (getDistance(me,5050,5142) <= 50) {
					// move to haram 1
					Pather.moveToExit(50, true);
					Pather.makePortal(true);
				}
			} else {
				Town.goToTown(2);
			}

			me.talkTo(NPC.Meshif)
		}

	}
})(module, require);