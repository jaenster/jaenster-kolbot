(function(module,require){

	module.exports = function () {
		Town.goToTown(1); // obv;
		Town.moveToSpot('stash');
		me.talkTo(NPC.Warriv);
	}
})(module,require);