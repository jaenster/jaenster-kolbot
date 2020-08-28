(function (module, require) {

	const QuestData = require('../../../modules/QuestData');

	const states = {
		Done: 0,
		PwnedAndy: 1,
		WantToTalkToWarriv: 3,
	};

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		const log = QuestData.fetchQuestArray(quest);
		let pwnedAndy = 0;

		if (!log[states.PwnedAndy]) {
			QuestData.logQuestStatuses(quest);
			// Already did quest?
			if (me.getQuest(quest.index, 0)) {
				return true; // Done already
			}


			print('Doing andy');
			Town();
			Pather.journeyTo(37);

			Pather.moveTo(22549, 9520);

			const andy = getUnit(1, 156);
			andy.kill();
			pwnedAndy |= andy.dead;
			Town.goToTown(1);


		}
		print('Pwned andy, now what?');

		if (log[states.WantToTalkToWarriv] || pwnedAndy) {
			print('Want to talk to warriv?');

			// Just talk with warriv, the next quest = able to go to act II, which get when travel to the right spot
			Town.goToTown(1); // We care about warriv in act 1.
			me.talkTo('Warriv');
		}

	}
})(module, require);