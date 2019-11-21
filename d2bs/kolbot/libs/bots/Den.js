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

		function doDen() {
			let promise = new Promise((resolve, reject) => {
				Pather.journeyTo(sdk.areas.DenOfEvil, true) && resolve() || reject();
			});

			// just testing Observable module
			Rx.Observable.fromPromise(promise)
				.subscribe(x => {
					// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
					let graph = new Graph();
					Graph.depthFirstSearch(graph, (room) => {
						Pather.moveTo(room.walkableX, room.walkableY, 3, true);
						Attack.clear(room.xsize/2, 0);
					});
				},
				e => {
					print("error "+e);
				},
				() => {
					print("complete");
				});
		}

		Quests.on(sdk.quests.DenOfEvil, (state) => {
			print("Den quest update");
			if (state[0]) { // quest done
				print("Den quest done");
				return;
			}
			if (!state[1]) { // quest not done
				print("Doing Den quest");
				doDen();
			}
			else { // all monsters killed, talk to akara
				if (me.inTown) {
					me.talkTo(NPC.Akara);
				}
				else {
					var tries = 0;
					while (!me.inTown && tries < 3) {
						Pather.journeyTo(sdk.areas.RogueEncampment, true);
						tries++;
					}
					me.talkTo(NPC.Akara);
				}
			}
		});

		Quests.emit(sdk.quests.DenOfEvil, Quests.states[sdk.quests.DenOfEvil]);
	}

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
