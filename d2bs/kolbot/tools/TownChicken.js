/**
*	@filename	TownChicken.js
*	@author		kolton
*	@desc		handle town chicken
*/

js_strict(true);

include('require.js');
include("OOG.js");
include("Gambling.js");
include("CraftingSystem.js");

include("common/Cubing.js");
include("common/Config.js");
include("common/Misc.js");
include("common/Pather.js");

include("common/Prototypes.js");
include("common/Runewords.js");

function main() {
	const Config = require('Config');
	const Town = require('Town');
	var townCheck = false;

	this.togglePause = function () {
		var i,	script,
			scripts = ["default.dbj", "tools/antihostile.js", "tools/rushthread.js", "tools/CloneKilla.js"];

		for (i = 0; i < scripts.length; i += 1) {
			script = getScript(scripts[i]);

			if (script) {
				if (script.running) {
					if (i === 0) { // default.dbj
						print("ÿc1Pausing.");
					}

					script.pause();
				} else {
					if (i === 0) { // default.dbj
						if (!getScript("tools/clonekilla.js")) { // resume only if clonekilla isn't running
							print("ÿc2Resuming.");
							script.resume();
						}
					} else {
						script.resume();
					}
				}
			}
		}

		return true;
	};

	addEventListener("scriptmsg",
		function (msg) {
			if (msg === "townCheck") {
				if (me.area === 136) {
					print("Can't tp from uber trist.");
				} else {
					townCheck = true;
				}
			}
		});

	// Init config and attacks
	D2Bot.init();
	CraftingSystem.buildLists();
	Runewords.init();
	Cubing.init();

	while (true) {
		if (!me.inTown && (townCheck ||
			(Config.TownHP > 0 && me.hp < Math.floor(me.hpmax * Config.TownHP / 100)) ||
			(Config.TownMP > 0 && me.mp < Math.floor(me.mpmax * Config.TownMP / 100)))) {
			this.togglePause();

			while (!me.gameReady) {
				delay(100);
			}

			try {
				me.overhead("Going to town");
				Town.visitTown();
			} catch (e) {
				Misc.errorReport(e, "TownChicken.js");
				scriptBroadcast("quit");

				return;
			} finally {
				this.togglePause();

				townCheck = false;
			}
		}

		delay(50);
	}
}