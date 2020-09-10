(function (module, require) {

	const QuestData = require('../../../modules/QuestData');

	const walkTo = require('../modules/WalkTo');

	const states = {
		Done: 0,
		PwnedAndy: 1,
		WantToTalkToWarriv: 3,
	};

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		const log = QuestData.fetchQuestArray(quest);
		let pwnedAndy = 0;

		if (!log[states.PwnedAndy] || true) {
			// Already did quest?
			if (me.getQuest(quest.index, 0) && false) {
				return true; // Done already
			}


			print('Doing andy');
			Town();
			Pather.journeyTo(sdk.areas.CatacombsLvl4);

			const nodes = [
				{x: 22588,y: 9637},
				{x: 22576,y: 9635},
				{x: 22542,y: 9640},
				{x: 22549,y: 9621},
				{x: 22515,y: 9586},
				{x: 22572,y: 9586},
				// {x: 22551,y: 9574},
			];

			walkTo(nodes,0, 15);

			const andy = getUnit(1, 156);
			andy.kill();
			pwnedAndy |= andy.dead;
			Town.goToTown(1);

		}

		if (log[states.WantToTalkToWarriv] || pwnedAndy) {
			print('Want to talk to warriv?');

			// Just talk with warriv, the next quest = able to go to act II, which get when travel to the right spot
			Town.goToTown(1); // We care about warriv in act 1.
			me.talkTo('Warriv');
			me.cancel() && me.cancel();
			const NPC = require('../../../modules/NPC');
			let npc = getUnit(1, NPC.Warriv);
			if (npc) {
				npc.useMenu(sdk.menu.GoWest);
			}
		}
		print('Pwned andy, now what?');

	}
})(module, require);