/**
 * @description This file is just here to provide an default for D2BotManual.js. You can use your own profile if you want
 */

(function (module, require, Config, AutoConfig, StarterConfig, Scripts) {
	AutoConfig();
	Scripts.MapHack = true;
	Config.PickitFiles.push("pots.nip");
	module.exports = Scripts;
	require('../libs/modules/PacketSnooper');
})(module, require, require('../libs/modules/Config'), require('../libs/modules/AutoConfig'), require('../libs/modules/Config').StarterConfig, {} /*Scripts*/);