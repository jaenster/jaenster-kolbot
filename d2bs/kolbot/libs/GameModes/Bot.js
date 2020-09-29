(function(module,require) {

	const GameMode = require('../modules/GameMode');

	new GameMode({
		// Always active, but checked as last
		active: () => true,
		prio: -999,
		handler: function () {
			require('../modules/Chicken');

			// Load config and execute
			const Config = require('../modules/Config')();

			me.maxgametime = Config.MaxGameTime * 1000;
			let stats = DataFile.getStats();
			if (stats.name === me.name && me.getStat(13) < stats.experience && Config.LifeChicken > 0) {
				D2Bot.printToConsole("You died in last game", 9);
				D2Bot.printToConsole("Experience decreased by " + (stats.experience - me.getStat(13)), 9);
				DataFile.updateStats("deaths");
				D2Bot.updateDeaths();
			}

			DataFile.updateStats(["experience", "name"]);
			me.switchWeapons(0); // always start at slot 0

			load("tools/ToolsThread.js");

			const Town = require('../modules/Town');
			const Pickit = require('../modules/Pickit');
			Town.getCorpse();
			Pickit.pickItems();

			me.automap = Config.AutoMap;

			const Loader = require('../modules/Loader'),
				Misc = require('../modules/Misc');

			try {
				Loader(Config);
			} catch(e) {
				Misc.errorReport(e);
			}

			if (Config.MinGameTime && getTickCount() - startTime < Config.MinGameTime * 1000) {
				try {
					Town.goToTown();

					while (getTickCount() - startTime < Config.MinGameTime * 1000) {
						me.overhead("Stalling for " + Math.round(((startTime + (Config.MinGameTime * 1000)) - getTickCount()) / 1000) + " Seconds");
						delay(1000);
					}
				} catch (e1) {
					print(e1);
				}
			}

			DataFile.updateStats("gold");
			scriptBroadcast("quit");
		}
	})

})(module, require);