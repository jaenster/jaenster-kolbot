/**
 * @description This file is just here to provide an default for D2BotManual.js. You can use your own profile if you want
 */

(function (module, require, Config, AutoConfig, StarterConfig, Scripts) {
	AutoConfig();
	Scripts.MapHack = true;
	Config.PickitFiles.push("pots.nip");
	module.exports = Scripts;
})(module, require, require('Config'), require('AutoConfig'), require('Config').StarterConfig, {});