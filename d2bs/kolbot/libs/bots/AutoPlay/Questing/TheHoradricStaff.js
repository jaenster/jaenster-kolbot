(function (module, require) {
	const sdk = require('../../modules/sdk');
	module.exports = function (quest) {
		const cube = me.findItem('box');
		if (!cube) {
			// Dont have a cube, fetch one
			Cubing.getCube();//ToDO; write a proper function
		}

		let fullStaff = me.getItem(91);


		print('Putting amulet in cube');
		let amulet = me.getItem("vip");
		if (!amulet && !fullStaff) {
			// somehow lost the amulet, do the quest of getting the amulet again
			require('./TheTaintedSun')(require('../../../modules/QuestData')[sdk.quests.TheTaintedSun])
		} else if (!fullStaff) {
			Cubing.openCube();
			clickItemAndWait(0, amulet);
			clickItemAndWait(0, 1, 1, sdk.storage.Cube);
		}

		let staff = me.getItem("msf"), needToVisitCain = !!staff;
		fullStaff = me.getItem(91);
		if (!staff && !fullStaff) {
			// get the staff
			me.journeyToPreset(sdk.areas.MaggotLairLvl3, 2, 356);

			me.getQuestItem(92, 356);
			staff = me.getItem("msf");

		}

		if (!fullStaff) {
			// Open cube, move to cube
			Cubing.openCube();
			clickItemAndWait(0, staff);
			clickItemAndWait(0, 0, 0, sdk.storage.Cube);
			transmute();
			me.cancel();
		}


		Town.goToTown(2); // can be we are still @ the cubing bit
		if (needToVisitCain) {
			me.talkTo('cain');
		}
		Pather.useWaypoint(sdk.areas.CanyonOfMagi);
		let tombID = getRoom().correcttomb;
		Pather.moveToExit(tombID, true);

		// Move to spot we want
		Pather.moveToPreset(me.area, 2, 152, 0, 0);
		Pather.makePortal();
		const portal = Pather.getPortal(sdk.areas.LutGholein);
		delay(500);
		fullStaff = me.getItem(91);
		// open cube
		Cubing.openCube();
		print('Getting staff from cube');
		// clickItemAndWait(0, fullStaff);
		// me.cancel();

		// Move to storage
		Storage.Inventory.MoveTo(fullStaff);
		me.cancel();
		me.cancel();
		delay(250);


		// cast telekenis on orrfice
		getUnit(2, 152).cast(sdk.skills.Telekinesis);
		clickItemAndWait(0, fullStaff);
		submitItem();
		delay(500);

		Pather.usePortal(null, null, portal);

		// Clear cursor of staff
		const item = me.getItem(518); // tome
		const [x, y, loc] = [item.x, item.y, item.location];
		clickItemAndWait(0, item);
		clickItemAndWait(0, x, y, loc);

		delay(12e3); // Wait until duriel is open
	}
})(module, require);