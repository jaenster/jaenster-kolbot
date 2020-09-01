(function(module,require) {
	const Scripts = {};
	const Storage = require('../../modules/Storage');

	const AutoConfig = require('../../modules/AutoConfig');
	AutoConfig();

	Config.Inventory[0] = [1,1,1,1,1,1,1,1,1,1];
	Config.Inventory[1] = [1,1,1,1,1,1,1,1,1,1];
	Config.Inventory[2] = [1,1,1,1,1,1,1,1,1,1];
	Config.Inventory[3] = [1,1,1,1,1,1,1,1,1,1];

	Config.LowGold = me.charlvl * 1000;

	Scripts.AutoPlay = true;

	// Here go the pickit files
	Config.PickitFiles.push("pots.nip");


	Config.BeltColumn = [
		'hp','hp','hp','hp'
	];

	Config.HPBuffer = 15;
	Config.MPBuffer = 15;

	const beltSize = Storage.BeltSize();
	Config.MinColumn = [beltSize,beltSize,beltSize,beltSize];

	Config.LowGold = me.charlvl * 1e3;

	Config.MPBuffer = 10;
	Config.HPBuffer = 3;

	Config.HealHP = 70;
	Config.HealMP = 70;

	require('./AutoConfig/Setup');
	require('../../modules/AutoEquip');
	module.exports = Scripts;

})(module,require);