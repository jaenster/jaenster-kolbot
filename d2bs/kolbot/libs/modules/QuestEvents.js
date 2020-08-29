/**
 *    @description a tool to keep track of all quests
 *    @author Jaenster
 *
 */
(function (module, require) {
	const questEvents = new (require('../modules/Events'))();
	const Worker = require('../modules/Worker');

	const getQuests = (q, newQuest = []) => {
		for (let y = 0; y < 12; y++) newQuest.push(me.getQuest(q, y));
		return newQuest;
	};

	const message = {
		0: {
			0: 'Welcome to act I',
		},
		1: {
		 	3: 'Find den of evil',
		},
		2: {
			1: 'Quest completed',
			4: 'Kill blood raven',
		},
		6: {
			0: 'Quest completed',
			1: "Warriv wants to talk",

			3: "On your way to andy",
			4: "Andy in sight",

		},
		7: {
			0: 'Your able to go to act II',
		},
		8: { // strange this is a seperated quest
			0: 'Spoke with Jerhyn',
		},
		10: {
			0: 'Quest completed',
			11: 'Staff cubed',
		},
		11: {
			0: 'Quest completed',
		 	1: 'Talk to Drogan',
		},
		12: {
			0: 'Quest completed',
			1: 'Journal is active',
			2: 'Journal is in the place',
			5: 'Journal is nearby',
			7: 'Some additional state unknown',
			8: 'Some additional state unknown',
		},
		13: {
			0: 'Quest completed',
			1: 'Return to town for more information',
			2: 'Can pwn summoner',
		},
		14: {
			0: 'Quest completed',
			2: 'Ready to place staff',
			3: 'Talk to Jerhyn',
			4: 'Talk to Meshif',
			5: 'Explore tombs',
		},
		15: {
			0: 'Your able to go to act III',
		},
		18: {
			0: 'Quest done',
			11: 'Equip flail',
		},
		21: {
			0: 'Quest done',
			3: 'Beware the high council',
			4: 'talk to cain',
		},
		22: {
			0: 'Quest done',
			8: 'Search for mephisto in his durance',
			9: 'Pwn mephisto',
		},
		23: {
			0: 'Able to go to act IV',
		},
		26: {
			3: 'Find diablo in his sanctuary',
		},

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
			// questEvents.emit(q, states[q]); // First time in game, or when this is used, trigger all
			// questEvents.emit('all', {
			// 	q: q,
			// 	state: states[q],
			// });
			return; // re-check next time
		}

		// see if there is a new quest state
		const newQuestState = getQuests(q);
		if (!newQuestState.isEqual(states[q])) { // There are differences
			const changed = [];
			newQuestState.forEach((c, i) => c !== states[q][i] && changed.push({key: i, value: c}));

			states[q] = newQuestState;

			if (typeof message[q] !== 'undefined') {
				changed.forEach(el => {
					const key = el.key, value = el.value;
					const msg = typeof message[q][key] === 'string' && (message[q][key]+': '+Boolean(value).toString()) || JSON.stringify(el);

					console.debug(Object.keys(sdk.quests).filter(el=>sdk.quests[el]===q).first(), msg);
				})
			} else {
				print(q+' => '+JSON.stringify(changed));
			}

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