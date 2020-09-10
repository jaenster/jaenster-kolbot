(function () {

	const QuestData = require('../../../modules/QuestData');
	const walkTo = require('../modules/WalkTo');

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		// Log the quest status

		const log = QuestData.fetchQuestArray(quest);

		Pather.journeyTo(sdk.areas.ClawViperTempleLvl2);

		const nodes = [
			{x: 15048,y: 14019},
			{x: 15060,y: 14045},
			{x: 15062,y: 14067},
			{x: 15044,y: 14053},
		];

		walkTo(nodes,true, 10);

		me.getQuestItem(521, 149);
		Town.goToTown(2);

		me.talkTo('drognan');
	};

})();