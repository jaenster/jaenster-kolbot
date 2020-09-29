//
(function (module, require) {

	const Worker = require('../../../modules/Worker');
	const Town = require('../../../modules/Town');
	const Pather = require('../../../modules/Pather');

	const settings = module.exports = {
		disabled: false,
	};

	console.debug('---------------'+Config.TownHP);
	// visit town when we are out of pots
	Worker.runInBackground.townVisit = function () {

		// dont run for pots all the time if we are low on gold
		if (me.gold < Config.LowGold || settings.disabled || me.inTown) return true;

		const items = (me.getItems() || []).filter(el => el.location === sdk.storage.Inventory || el.location === sdk.storage.Belt),
			filterMp = item => item.classid > 591 && item.classid < 597,
			filterHp = item => item.classid > 586 && item.classid < 592;

		let townVisit = (
			(Config.MPBuffer && !items.filter(filterMp).length && me.mp < me.mpmax / 2)
			|| (Config.HPBuffer && !items.filter(filterHp).length)
			|| (100 / me.hpmax * me.hp <= Config.TownHP)
		);
		//
		// console.debug(
		// 	(Config.MPBuffer && !items.filter(filterMp).length && me.mp < me.mpmax / 2)
		// 	, (Config.HPBuffer && !items.filter(filterHp).length)
		// 	, (100 / me.hpmax * me.hp <= Config.TownHP)
		// );

		if (townVisit) {
			console.debug('Restock on pots or chicken');
			const [area, act] = [me.area, me.act];
			Pather.makePortal(true);
			Town();

			// we may buy pots in another act?
			Town.goToTown(act);
			Town.moveToSpot('portalspot');
			Pather.usePortal(area, me.name);
			delay(300); // give a sec to update our x,y
		}

		return true;
	};

})(module, require);