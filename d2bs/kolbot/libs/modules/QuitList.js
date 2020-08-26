/**
 * @author Jaenster
 * @description The module that handle quiting with another char from game.
 */

(function (module, require) {

	const GameEvent = require('../modules/GameEvent');
	const Config = require('../modules/Config');
	const Promise = require('../modules/Promise');
	const Misc = require('../modules/Misc');

	GameEvent.on('quit', function (name, account) {
		let wantToQuit = false;
		const quitList = typeof module.exports.QuitList === 'string' && [module.exports.QuitList] || module.exports.QuitList;
		switch (module.exports.QuitListMode) {
			case 0: // char name
				wantToQuit = quitList.indexOf(name) !== -1;
				break;
			case 1: // profile name
				wantToQuit = quitList.some(profile => {
					if (!FileTools.exists("data/" + profile + ".json")) return false; // doesnt exists, so not a profile
					const string = Misc.fileAction("data/" + profile + ".json", 0);
					try {
						const obj = JSON.parse(string);
						return typeof obj === 'object' && obj && obj.hasOwnProperty("name") && obj.name === name;
					} catch (e) {
						// dont care for an error here.
					}
					return false;
				});
				break;
			case 2: // account name
				wantToQuit = quitList.indexOf(account) !== -1;
				break;
		}

		if (!wantToQuit) return; // Dont want to quit

		const time = getTickCount();

		print(JSON.stringify(module.exports.QuitDelay));
		// Get the delay, either generate it randomly or use the set time, or just use zero
		const delay = typeof module.exports.QuitDelay === 'number' ? module.exports.QuitDelay : (Array.isArray(module.exports.QuitDelay) && rand.apply(null, module.exports.QuitDelay) * 1000) || 0;

		print('Quiting game -> waiting ' + Math.round(delay / 100) / 10 + ' seconds');
		// resolve once time's up
		delay > 0 && new Promise(resolve => getTickCount() - time > delay && resolve()).then(quit) || quit();
	});

	module.exports = {
		QuitList: Config.QuitList,
		QuitListMode: Config.QuitListMode,
		QuitDelay: Config.QuitDelay,
	}
})(module, require);