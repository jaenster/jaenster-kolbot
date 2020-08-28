(function() {

	const QuestData = require('../../../modules/QuestData');

	module.exports = function (quest) {
		// Log the quest status
		QuestData.logQuestStatuses(quest);

		const log = QuestData.fetchQuestArray(quest);

		Pather.useWaypoint(sdk.areas.LostCity);
		Pather.moveToExit([sdk.areas.ValleyOfSnakes,sdk.areas.ClawViperTempleLvl1,sdk.areas.ClawViperTempleLvl2],true);

		Pather.moveTo(15044, 14045); // ToDo; figure out what lvl we are

		me.getQuestItem(521, 149);
		Town.goToTown(2);

		me.talkTo('drognan');
	};

})();