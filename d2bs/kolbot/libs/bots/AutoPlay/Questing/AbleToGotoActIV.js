(function (module, require) {
	module.exports = function () {
		if (me.area !== sdk.areas.DuranceOfHateLvl3) {
			Pather.journeyTo(sdk.areas.DuranceOfHateLvl3);
		}

		// If we are far away from the river bank we cant see if its open
		if (getDistance(me,17590, 8068) > 40) Pather.moveTo(17590, 8068); // get close

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

})(module, require);