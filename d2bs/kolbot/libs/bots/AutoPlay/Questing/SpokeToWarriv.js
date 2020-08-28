(function (module, require) {

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		const NPC = require('../../../modules/NPC');
		Town.goToTown(1); // obv;
		Town.moveToSpot('stash');
		me.talkTo(NPC.Warriv);
	}

})(module, require);