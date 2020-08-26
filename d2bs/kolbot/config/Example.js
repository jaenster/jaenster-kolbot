/**
 * @description This is the new, simplified, unified, config file
 */

(function (module, require, Config, AutoConfig, StarterConfig, Scripts) { // Some magic to make it all work, do not touch this line


// Edit from here;

	// Figure out all settings on its own
	// Including skills, inventory, belt, merc usage, chicken, everything
	AutoConfig();

	// In the future you dont need to do this, but for now you still need to setup your inventory configuration.
	// like in original kolton, Config.Inventory[x] = [0,0,0,0,0,0....] you get the idea ;)
	// If you dont, every thing is locked


	// Here go your scripts as your used to.
	// You can paste them from Scripts.txt.
	Scripts.AutoMagicFind = true;

	// Here go the pickit files
	Config.PickitFiles.push("pots.nip");


	// Tell other bots in this world, about your run. So they can join in
	Config.Advertisement = true;

	// In case you want to override some specific setting,

	// Examples: (including D2BotWhatever files)

	/** Here some D2BotWhatever setting examples*/
	//StarterConfig.MinGameTime = 60*3; // At least 3 minutes
	//Config.Follow = 'profileOfLeader'; // (like your used to in D2BotFollow with the JoinSettings)

	/** Some classic configuration examples */
	//Config.PacketCasting = 2; // Use packet casting for everything
	//Config.QuitList = ['myLeader']; // Exit the game if my leader does so too



// Some magic to make it all work, do not touch after this line
	module.exports = Scripts;
})(module, require, require('../libs/modules/Config'), require('../libs/modules/AutoConfig'), require('../libs/modules/Config').StarterConfig, {} /*Scripts*/);