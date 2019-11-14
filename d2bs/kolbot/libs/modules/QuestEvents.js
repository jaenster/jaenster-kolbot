/**
 *    @description a tool to keep track of all quests
 *    @author Jaenster
 *
 */
(function (module, require) {
	const questEvents = new (require('Events'))();
	const Worker = require('Worker');
	require('Debug');

	const getQuests = (q, newQuest = []) => {
		for (let y = 0; y < 12; y++) newQuest.push(me.getQuest(q, y));
		return newQuest;
	};

	let states = [];
	const Quests = {
		on: questEvents.on,
		off: questEvents.off,
		once: questEvents.once,

		trigger: questEvents.trigger,
		emit: questEvents.emit,

		handlers: {// Typical handlers for quests

		},
		getQuests: getQuests,
		states: new Proxy([], {
			get: function (target, q) {
				!states.hasOwnProperty(q) && refreshQuest(q);

				return states[q];
			}
		}),
	};

	let tick = getTickCount();
	let internalCheck = -1;

	function refreshQuest(q) {
		if (!me.ingame || !me.gameReady) return; // in case we are not in game, or loading act/game

		if (getTickCount() - tick > 1500) {
			sendPacket(1, 0x40);
			tick = getTickCount();
		}
		// If old quest state isn't known yet. Fill it in
		if (!states.hasOwnProperty(q)) {
			states[q] = getQuests(q);
			questEvents.emit(q, states[q]); // First time in game, or when this is used, trigger all
			questEvents.emit('all', {
				q: q,
				state: states[q],
			});
			return; // re-check next time
		}

		// see if there is a new quest state
		const newQuestState = getQuests(q);
		if (!newQuestState.isEqual(states[q])) { // There are differences
			const changed = [];
			newQuestState.forEach((c, i) => c !== states[q][i] && changed.push({key: i, value: c}));

			states[q] = newQuestState;
			questEvents.emit(q, states[q]); // Trigger
			questEvents.emit('all', {
				q: q,
				state: states[q],
			});
		}

	}

	Worker.runInBackground.questing = () => refreshQuest.apply(Quests, [internalCheck = (internalCheck + 1) % 44]) || true;


	module.exports = Quests;

})(module, require);