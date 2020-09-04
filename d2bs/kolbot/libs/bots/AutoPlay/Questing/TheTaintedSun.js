(function () {

	const QuestData = require('../../../modules/QuestData');
	const walkTo = require('../modules/WalkTo');

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		// Log the quest status

		const log = QuestData.fetchQuestArray(quest);

		Pather.journeyTo(sdk.areas.ClawViperTempleLvl2);

		walkTo({x: 15044, y: 14045}); // ToDo; figure out what lvl we are

		me.getQuestItem(521, 149);
		Town.goToTown(2);

		me.talkTo('drognan');
	};

})();