/**
 * @description This is the new, simplified, unified, config file
 */
(function (module, require, Config, AutoConfig, StarterConfig, Scripts) {


// Edit from here;

	// Figure out all settings on its own
	// Including skills, inventory, belt, merc usage, chicken, everything
	AutoConfig();

	// Here go your scripts as your used to. You can paste them from Scripts.txt.
	Scripts.AutoMagicFind = true;

	// Here go the pickit files
	Config.PickitFiles.push("pots.nip");


	/** In case you want to override some specific setting, Examples (including D2BotWhatever files): */

	/** Here some D2BotWhatever setting examples*/
	//StarterConfig.MinGameTime = 60*3; // At least 3 minutes
	//Config.Follow = 'profileOfLeader';

	/** Some classic configuration examples */
	//Config.PacketCasting = 2; // Use packet casting for everything
	//Config.QuitList = ['myLeader']; // Exit the game if my leader does so too


// Dont edit after this,
// No touchy
	module.exports = Scripts; // and in the end, give this config back
})(module, require, require('Config'), require('AutoConfig'), require('Config').StarterConfig, {} /*Scripts*/);