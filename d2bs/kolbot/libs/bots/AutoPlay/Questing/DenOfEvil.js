(function () {
	const Attack = require('../../../modules/Attack');

	module.exports = function () {
		debug('Doing den of evil');

		if (me.area !== sdk.areas.BloodMoor && me.area !== sdk.areas.DenOfEvil) {
			Town.goToTown(1) && !Pather.moveToExit([2, 8], true)

		} else if (me.area !== sdk.areas.BloodMoor) {
			Pather.moveToExit(sdk.areas.DenOfEvil, true);
		}

		if (me.area !== sdk.areas.DenOfEvil) {
			throw new Error('failed to move to den');
		}

		Precast.doPrecast(true);
		Attack.clearLevelWalking();
		Town.goToTown();
		Town.move("akara");

		const akara = getUnit(1, "akara");

		akara.openMenu();
		me.cancel();
		return true;
	}
});