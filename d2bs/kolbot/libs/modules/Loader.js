/**
 *    @filename    Loader.js
 *    @author        kolton, jaenster
 *    @desc        script loader
 */

(function (module, require) {

	const Loader = function () {
		Loader.getScripts();
		Loader.loadScripts();
	};

	Loader.fileList = [];
	Loader.scriptList = [];
	Loader.scriptIndex = -1;
	Loader.skipTown = ["Test", "Follower", 'AutoPlay'];

	Loader.getScripts = function () {
		var i,
			fileList = dopen("libs/bots/").getFiles();

		for (i = 0; i < fileList.length; i += 1) {
			if (fileList[i].indexOf(".js") > -1) {
				Loader.fileList.push(fileList[i].substring(0, fileList[i].indexOf(".js")));
			}
		}
	};

	Loader.loadScripts = function () {
		const Scripts = Config.Scripts;
		let s, script,
			unmodifiedConfig = {};


		if (!Loader.fileList.length) {
			showConsole();

			throw new Error("You don't have any valid scripts in bots folder.");
		}

		for (s in Scripts) {
			if (Scripts.hasOwnProperty(s) && Scripts[s]) {
				Loader.scriptList.push(s);
			}
		}

		for (Loader.scriptIndex = 0; Loader.scriptIndex < Loader.scriptList.length; Loader.scriptIndex++) {
			script = Loader.scriptList[Loader.scriptIndex];
			Loader.runScript(script,Config);
		}
	};
	Loader.runScript = function (script) {
		const Attack = require('./Attack');
		const Pickit = require('./Pickit');
		const Messaging = require('./Messaging');
		const Town = require('./Town');
		const Misc = require('./Misc');
		const Pather = require('./Pather');

		let scriptModule;
		try {
			// trying to require the bot
			scriptModule = require('../bots/' + script);
			if (!scriptModule) throw new Error('Failed to load'); // Fake an error, to load the file by hand
		} catch (e) {
			//Failed to load as module, loading on the old way
			if (typeof (global[script]) !== "function" || !include("bots/" + script + ".js")) {
				Misc.errorReport("Failed to include script: " + script);
				return;
			}
		}

		if (scriptModule || isIncluded("bots/" + script + ".js")) {
			try {
				if (Loader.skipTown.indexOf(script) > -1 || Town.goToTown()) {
					print("ÿc2Starting script: ÿc9" + script);
					//scriptBroadcast(JSON.stringify({currScript: script}));
					Messaging.send(JSON.stringify({currScript: script}));

					let args = [Config, Attack, Pickit, Pather, Town, Misc];
					if (scriptModule) {
						scriptModule.apply(scriptModule, args);
					} else {
						if (typeof (global[script]) !== "function") throw new Error("Invalid script function name");
						// Assign a new object to the config object
						global[script].apply(global[script], args);
					}
				}
			} catch (error) {
				Misc.errorReport(error, script);
			}
		}
	};

	Loader.scriptName = function (offset = 0) {
		let index = Loader.scriptIndex + offset;

		if (index >= 0 && index < Loader.scriptList.length) {
			return Loader.scriptList[index];
		}

		return null;
	};

	module.exports = Loader;

})(module, require);