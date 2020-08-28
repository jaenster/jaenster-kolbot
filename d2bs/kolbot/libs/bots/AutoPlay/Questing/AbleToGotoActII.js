(function (module, require) {

	const QuestData = require('../../../modules/QuestData');

	module.exports = function (quest) {
		const log = QuestData.fetchQuestArray(quest);

		if (!log[0]) { // Need to do this quest still

			let npc = getInteractedNPC();

			// If not talking with Warriv yet (can be from last quest)
			if (!(npc && me.act === 1 && npc.name === 'Warriv')) {
				Town.goToTown(1);
				npc = me.talkTo('Warriv'); // talk with the bitch
			}

			if (!npc) { // something went very wrong
				throw new Error('Failed to talk with Warriv');
			}

			// travel to act 2.
			npc.useMenu(sdk.menu.GoEast);

			if (me.act === 2) {
				// try to travel back with warriv
				npc = me.talkTo('Warriv');
				if (npc) {
					npc.useMenu(sdk.menu.GoWest);
				}
			}
		}

	}

})(module, require);