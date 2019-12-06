/**
 * @author ryancrunchi
 * @description Den of evil.
 */
(function (module,require) {
	const Den = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
			Quests = require('QuestEvents');

		var denCleared = false;
		var questDone = false;

		function doDen() {
			while (!denCleared && ! questDone) {
				Pather.journeyTo(sdk.areas.DenOfEvil, true);
				let graph = new Graph();
				Graph.nearestNeighbourSearch(graph, (room) => {
					Pather.moveTo(room.walkableX, room.walkableY, 3, true);
					// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
					Attack.clear(room.xsize, 0);
					Pather.moveTo(room.walkableX, room.walkableY, 3, true);
				});
			}
		}

		Quests.on(sdk.quests.DenOfEvil, (state) => {
			switch (true) {
			case state[0]:
				questDone = true;
				break;

			case state[1]: // all monsters killed, talk to akara
				denCleared = true;
				var tries = 0;
				while (!me.inTown && tries < 3) {
					Pather.journeyTo(sdk.areas.RogueEncampment, true);
					tries++;
				}
				me.talkTo(NPC.Akara);
				break;

			default:
				doDen();
				break;
			}
		});

		Quests.emit(sdk.quests.DenOfEvil, Quests.states[sdk.quests.DenOfEvil]);
		while (!questDone) {
			delay(50);
		}
		return true;
	}

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
