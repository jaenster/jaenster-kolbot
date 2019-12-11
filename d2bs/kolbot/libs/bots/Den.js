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

	Den.clearDen = () => {
		Pather.journeyTo(sdk.areas.DenOfEvil, true);
		let graph = new Graph();
		Graph.nearestNeighbourSearch(graph, (room) => {
			Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
			Attack.clear(room.xsize*0.707, 0, Pather.useTeleport());
			Pather.moveTo(room.walkableX, room.walkableY, 3, true);
			Pickit.pickItems();
		});
	};

	Den.talkToAkara = () => {
		if (!Town.goToTown(1)) {
			Pather.journeyTo(sdk.areas.RogueEncampment, true);
		}
		me.talkTo(NPC.Akara);
	};

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
