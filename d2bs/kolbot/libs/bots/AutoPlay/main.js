/**
 * @author Jaenster
 * @description The file that loads all of the libs needed for the AutoPlay scripts
 */
(function (module, require) {


	// Actual classical bot script
	module.exports = function (...args) {

		let [Config, Attack, Pickit, Pather, Town, Misc] = args;


		const GameAnalyzer = require('../../modules/GameAnalyzer');

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

					case 'dungeon':
						console.debug('We want to pwn a dungeon');

						//ToDo; write properly
						break;

					case 'clear':
						console.debug('Want to clear a area: ' + nowWhat[1].LocaleString);
						break;

					case 'quest':
						const quest = nowWhat[1];
						console.debug('Want to do quest. ' + quest.name);

						if (lastScript === (scriptRunning = quest.name)) {
							console.log('Waiting 15 seconds to retry same script again');
							delay(1500);
						}

						require('./Questing/' + (lastScript = scriptRunning))(quest, Config, Attack, Pickit, Pather, Town, Misc);

						delay(1500);

						break;
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