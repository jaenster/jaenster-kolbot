/**
 * @description More clean way of using gameevent
 * @Author Jaenster
 */


(function (module, require) {
	const myEvents = new (require('Events'));
	const Worker = require('Worker');


	Worker.runInBackground.gameevent = (new function () {
		const workBench = [];
		const types = {};
		types[0x00] = types[0x01] = types[0x03] = 'quit';
		types[0x02] = 'join';
		types[0x06] = 'slain';
		types[0x07] = 'hostile';
		types[0x11] = 'soj';
		types[0x12] = 'clone';
		addEventListener('gameevent', (...data) => workBench.push(data));

		this.update = function () {
			if (!workBench.length) return true;

			let work = workBench.splice(0, workBench.length);
			work.forEach(function (data) {
				const [mode, param1, param2, name1, name2] = data;
				const args = [types[mode]];
				if (types[mode] === 'quit' || types[mode] === 'join' || (types[mode] === 'slain' && param2 === 0x03)) {
					args.push(name1, name2);
				} else if (types[mode] === 'soj') {
					args.push(param1);
				}
				myEvents.emit.apply(myEvents, args); // trigger the events
			});

			return true; // always, to keep looping;
		}
	}).update;


	/**
	 * @type {{once: ((function(*=, *): void)|*), off: ((function(*, *): void)|*), on: ((function(*=, *=): *)|*)}}
	 */
	module.exports = {
		/**
		 * @event module:GameData#quit
		 * @param {string} name
		 * @param {string} account
		 *
		 * @event module:GameData#join
		 * @param {string} name
		 * @param {string} account
		 *
		 * @event module:GameData#slain
		 * @param {string} name
		 * @param {string} killer
		 *
		 * @event module:GameData#hostile
		 * @param {string} name
		 *
		 * @event module:GameData#soj
		 * @param {string} count
		 *
		 * @event module:GameData#clone
		 */
		on: myEvents.on,
		off: myEvents.off,
		once: myEvents.once,
	};
})(module, require);