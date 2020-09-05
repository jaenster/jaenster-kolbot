//
(function (module, require) {

	const Worker = require('../../../modules/Worker');
	const Town = require('../../../modules/Town');

	const settings = module.exports = {
		disabled: false,
	};

	// visit town when we are out of pots
	Worker.runInBackground.townVisit = function () {

		// dont run for pots all the time if we are low on gold
		if (me.gold < Config.LowGold || settings.disabled || !me.inTown) return true;

		const items = (me.getItems() || []).filter(el => el.location === sdk.storage.Inventory),
			filterMp = item => item.classid > 591 && item.classid < 597,
			filterHp = item => item.classid === 515 || item.classid === 516;

		let townVisit = 0;

		// Go get mana pots if we have a buffer, yet no pots and less as half of mana left
		townVisit |= (Config.MPBuffer && !items.filter(filterMp).length && me.mp < me.mpmax / 2);
		townVisit |= (Config.HPBuffer && !items.filter(filterHp).length);

		if (townVisit) {
			console.debug('Restock on pots');
			const [area, act] = [me.area, me.act];
			Pather.makePortal(true);
			Town();

			// we may buy pots in another act?
			Town.goToTown(act);
			Town.moveToSpot('portalspot');
			Pather.usePortal(area, me.name);
		}

		return true;
	};

})(module, require);