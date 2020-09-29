(function(module,require){

	const NPC = require('../../../modules/NPC');
	const QuestData = require('../../../modules/QuestData');

	const states = {
		Done: 0,
	};

	module.exports = function(quest) {

		const log = QuestData.fetchQuestArray(quest);
		if (!log[states.Done]) {
			me.talkTo(NPC.Meshif).useMenu(sdk.menu.SailEast);
		}

	}
})(module,require);