/**
 * @author Jaenster
 * @description The file that loads all of the libs needed for the AutoPlay scripts
 */
(function (module, require) {

	// Mainly for debugging so i see changes now
	require('../../modules/QuestEvents');

	require('./AutoConfig/Setup');
	require('./Builds/Auto');

	// Actual classical bot script
	module.exports = function (...args) {

		let [Config, Attack, Pickit, Pather, Town, Misc] = args;
		const Feedback = require('./modules/Feedback');
		const GameAnalyzer = require('./modules/GameAnalyzer');

		const dungeon = require('./modules/Dungeon');
		const Worker = require('../../modules/Worker');

		Worker.runInBackground.townCheck = (() => {
			let inTown = me.inTown;
			return function () {
				if (me.inTown !== inTown) {
					(inTown = me.inTown) && Town();
				}
				return true;
			}
		})();

		let nowWhat, scriptRunning, lastScript;
		scriptRunning = lastScript = '';


		const errorOut = {};
		do {

			nowWhat = GameAnalyzer.nowWhat();
			delay(1000);
			try {
				switch (nowWhat && nowWhat.length >= 2 && nowWhat[0]) {
					case false:
					case undefined:
						console.debug('Nothing more to do');
						break;

					case 'dungeon': {
						const dungeonName = nowWhat[1];


						Feedback.lastDecision = 'Want to dungeon ' + dungeonName;
						console.debug('We want to pwn a dungeon');

						dungeon(dungeonName, Config, Attack, Pickit, Pather, Town, Misc);

						//ToDo; write properly
						break;
					}

					case 'clear': {
						const area = Feedback.area = nowWhat[1];

						Feedback.lastDecision = 'clear area ' + area.LocaleString;
						console.debug('Want to clear a area: ' + nowWhat[1].LocaleString);

						dungeon(area.Index, Config, Attack, Pickit, Pather, Town, Misc);
						break;
					}

					case 'quest': {
						const quest = nowWhat[1];
						Feedback.lastDecision = 'do quest ' + quest.name;
						console.debug('Want to do quest. ' + quest.name);

						if (lastScript === (scriptRunning = quest.name)) {
							console.log('Waiting 15 seconds to retry same script again');
							delay(1500);
						}

						require('./Questing/' + (lastScript = scriptRunning))(quest, Config, Attack, Pickit, Pather, Town, Misc);

						delay(1500);

						break;
					}
				}
			} catch (e) {
				console.log(e);
				Misc.errorReport(e, 'AutoPlay, ' + (scriptRunning || ''));
				if (typeof errorOut[me.area] === 'undefined') errorOut[me.area] = 0;
				if ((++errorOut[me.area]) > 5) break;
				console.log('Retry #' + (errorOut[me.area] + '/5'));
				delay(10000)
			}
		} while (nowWhat);


	}
})(module, require);