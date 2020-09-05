(function (module, require) {
	const Scripts = {};
	const Storage = require('../../modules/Storage');

	const AutoConfig = require('../../modules/AutoConfig');
	AutoConfig();

	Config.Inventory[0] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	Config.Inventory[1] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	Config.Inventory[2] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
	Config.Inventory[3] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

	Config.LowGold = me.charlvl * 1000;

	Scripts.AutoPlay = true;

	// Here go the pickit files
	Config.PickitFiles.push("pots.nip");


	Config.BeltColumn = [
		'hp', 'hp', 'hp', 'hp'
	];

	Config.HPBuffer = 15;
	Config.MPBuffer = 15;
	Config.RejuvBuffer = 3;
	Config.TownHP = 50;


	const beltSize = Storage.BeltSize();
	Config.MinColumn = [beltSize, beltSize, beltSize, beltSize];

	const Delta = new (require('../../modules/Deltas'));

	const basedOnLevel = function (formula, tracker) {
		// Once your char lvl changes, reset the cache
		Delta.track(tracker, () => cache = undefined);
		let overridden, cache;

		return {
			get: function () {
				if (typeof overridden !== 'undefined') return overridden;
				if (typeof cache === 'undefined') cache = formula();
				return cache;
			},
			set: function (v) {
				overridden = v;
			}
		}
	};

	Object.defineProperties(Config, {
		LowGold: basedOnLevel(() => (me.charlvl * 500) + (me.charlvl > 10 ? 500 * me.charlvl : 0), () => me.charlvl),

		StashGold: basedOnLevel(() => Config.LowGold / 10, () => me.charlvl),

		UseMerc: basedOnLevel(() => me.mercrevivecost !== 0, () => me.mercrevivecost !== 0), // once we get or hire merc we can use him.
	});

	Config.AutoMap = true;

	Config.MPBuffer = 10;
	Config.HPBuffer = 3;

	Config.HealHP = 70;
	Config.HealMP = 70;

	// Scans the items in shop for auto equip
	Config.MiniShopBot = true;

	// Config.MinGameTime = 3000;

	require('./AutoConfig/Setup');
	require('../../modules/AutoEquip');
	module.exports = Scripts;

})(module, require);