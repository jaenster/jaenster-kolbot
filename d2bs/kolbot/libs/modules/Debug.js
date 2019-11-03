/**
 * @description Ability to restart D2BotAuto.js, and in the feature, default.dbj
 * @author Jaenster
 */

(function (global) {
	function debug(what) {
		var stackNumber = 1, // exclude this function
			stack = new Error().stack.match(/[^\r\n]+/g),
			line = stack[stackNumber].substr(stack[stackNumber].lastIndexOf(':') + 1),
			functionName = stack[stackNumber].substr(0, stack[stackNumber].indexOf('@')),
			filename = stack[stackNumber].substr(stack[stackNumber].lastIndexOf('\\') + 1);

		filename = filename.substr(0, filename.indexOf('.'));

		typeof what === 'object' && (what = JSON.stringify(what));

		_print('ÿc:[ÿc5' + filename + 'ÿc:] (ÿc:' + functionName + ':' + line + 'ÿc:):ÿc0 ' + what);

	}

	let currentFile = 'libs/modules/debug.js';

	if (getScript(currentFile) && getScript(currentFile).name === getScript(true).name) {
		print('ÿc2Jaensterÿc0 :: Started Debug');
		include('require.js');
		let passTrough = {};
		// Just load this as an thread
		const Worker = require('Worker');
		// Some debug function, reload D2BotAuto.js
		Worker.runInBackground.reset = (new function () {
			let controlDown = false, reload = false;

			addEventListener('keydown', key => key && key === 17 /* ctrl */ && (controlDown = true));
			addEventListener('keyup', key =>
				(
					(key === 109 /*numpad - */ && controlDown && (reload = true))
					||
					(key === 17 /* ctrl */ && (controlDown = false))
				)
			);
			addEventListener('scriptmsg', function (data) {
				//print(JSON.stringify(data));
				if (typeof data === 'object' && data && data.pass) {
					passTrough = data;
				}
			});
			// Reload this script + stop this one
			this.update = function () {
				if (reload) {
					let script;
					while ((script = getScript('D2BotAuto.js'))) {
						script.stop();
					}
					load('D2BotAuto.js');
					reload = false;

					delay(100); // wait a bit
					print(JSON.stringify(passTrough));
					scriptBroadcast(passTrough)

				}
				return true;
			}; // true to keep looping
		}).update;

		while (true) {
			delay(1000); // Just idle
		}
	} else {
		if (!getScript(currentFile)) {
			load(currentFile);
			const Promise = require('Promise');
			new Promise(function (resolve) {
				return typeof handle !== 'undefined' && typeof gameInfo !== 'undefined' && resolve();
			}).then(function () {
				print('sending handle to debug function');
				scriptBroadcast({pass: {handle: handle, gameInfo: gameInfo}});
			})
		}

		global._print = global.print;

		global.print = debug;

	}
})(this);