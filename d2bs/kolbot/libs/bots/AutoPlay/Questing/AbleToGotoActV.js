(function(module,require){

	module.exports = function() {
		Town.goToTown(4);
		me.talkTo(NPC.Tyrael);
		me.cancel();
		getUnit(2,566).cast(sdk.skills.Telekinesis);
	}

})(module,require);