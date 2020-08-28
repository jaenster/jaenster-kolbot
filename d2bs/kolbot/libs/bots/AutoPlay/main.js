/**
 * @author Jaenster
 * @description The file that loads all of the libs needed for the AutoPlay scripts
 */
(function (module, require) {


	// Actual classical bot script
	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {


		const GameAnalyzer = require('../../modules/GameAnalyzer');

		let nowWhat, scriptRunning, lastScript;

		const errorOut = {};
		do {

			nowWhat = GameAnalyzer.nowWhat();
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
						break;
				}
			} catch (e) {
				console.log(e);
				Misc.errorReport(e, 'AutoPlay, ' + (scriptRunning || ''));

				if (++errorOut[me.area] > 5) break;
				console.log('Retry #' + (errorOut[me.area] + '/5'));
			}
		} while (nowWhat);


	}
})(module, require);