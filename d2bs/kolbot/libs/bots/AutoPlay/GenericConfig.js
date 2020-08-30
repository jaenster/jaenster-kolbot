(function(module,require) {
	const Scripts = {};
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

	require('./AutoConfig/Setup');
	module.exports = Scripts;

})(module,require);