/**
 *    @filename    Loader.js
 *    @author        kolton
 *    @desc        script loader, based on mBot's Sequencer.js
 */

var global = this;

var Loader = {
	fileList: [],
	scriptList: [],
	scriptIndex: -1,
	skipTown: ["Test", "Follower"],

	init: function () {
		this.getScripts();
		this.loadScripts();
	},

	getScripts: function () {
		var i,
			fileList = dopen("libs/bots/").getFiles();

		for (i = 0; i < fileList.length; i += 1) {
			if (fileList[i].indexOf(".js") > -1) {
				this.fileList.push(fileList[i].substring(0, fileList[i].indexOf(".js")));
			}
		}
	},

	loadScripts: function () {
		const Config = require('Config');
		const Scripts = Config.Scripts;
		const Attack = require('Attack');
		let s, script,
			unmodifiedConfig = {};


		if (!this.fileList.length) {
			showConsole();

			throw new Error("You don't have any valid scripts in bots folder.");
		}

		for (s in Scripts) {
			if (Scripts.hasOwnProperty(s) && Scripts[s]) {
				this.scriptList.push(s);
			}
		}

		for (this.scriptIndex = 0; this.scriptIndex < this.scriptList.length; this.scriptIndex++) {
			script = this.scriptList[this.scriptIndex];

			if (this.fileList.indexOf(script) < 0) {
				Misc.errorReport("ÿc1Script " + script + " doesn't exist.");
				continue;
			}

			if (!include("bots/" + script + ".js")) {
				Misc.errorReport("Failed to include script: " + script);
				continue;
			}

			if (isIncluded("bots/" + script + ".js")) {
				try {
					if (typeof (global[script]) !== "function") throw new Error("Invalid script function name");

					if (this.skipTown.indexOf(script) > -1 || Town.goToTown()) {
						print("ÿc2Starting script: ÿc9" + script);
						//scriptBroadcast(JSON.stringify({currScript: script}));
						Messaging.sendToScript("tools/toolsthread.js", JSON.stringify({currScript: script}));

						// Assign a new object to the config object
						global[script](Object.assign(typeof Scripts[script] === 'object' && Scripts[script] || {}, Config), Attack, Pickit);
					}
				} catch (error) {
					Misc.errorReport(error, script);
				}
			}
		}
	},

	scriptName: function (offset = 0) {
		let index = this.scriptIndex + offset;

		if (index >= 0 && index < this.scriptList.length) {
			return this.scriptList[index];
		}

		return null;
	}
};
