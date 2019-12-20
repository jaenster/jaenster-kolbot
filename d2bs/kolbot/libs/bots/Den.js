/**
 * @author ryancrunchi
 * @description Den of evil.
 */
(function (module,require) {
	const Den = function (Config, Attack, Pickit, Pather, Town) {
		
	};
	const Promise = require('Promise'),
			Attack = require('Attack'),
			Pickit = require('Pickit'),
			Pather = require('Pather'),
			Town = require('Town'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Graph = require('Graph'),
			NPC = require('NPC'),
			Quests = require('QuestEvents');

	Den.observeQuest = () => {
		let observable = Rx.Observable.create(observer => {
			Quests.on(sdk.quests.DenOfEvil, (state) => {
				observer.next(state);
				if (state[0]) {
					observer.complete();
				}
			});

			Quests.emit(sdk.quests.DenOfEvil, Quests.states[sdk.quests.DenOfEvil]);

			return () => {
				Quests.off(sdk.quests.DenOfEvil);
			};
		});
		
		return observable;
	};

	Den.clear = () => {
		Pather.journeyTo(sdk.areas.DenOfEvil, true);
		let graph = new Graph();
		Graph.nearestNeighbourSearch(graph, (room) => {
			Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
			Attack.clear(room.xsize*0.707, 0);
			Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			Pickit.pickItems();
		});
	};

	Den.talkToAkara = () => {
		var inTown = false;
		try {
			inTown = Town.goToTown(1);
			if (!inTown) {
				inTown = Pather.journeyTo(sdk.areas.RogueEncampment, true);
			}
		}
		catch (e) {
			print(e);
			inTown = Pather.journeyTo(sdk.areas.RogueEncampment, true);
		}
		if (inTown) {
			return me.talkTo(NPC.Akara);
		}
		return false;
	};

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
