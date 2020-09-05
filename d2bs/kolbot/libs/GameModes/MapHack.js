(function(module,require) {

	const GameMode = require('../modules/GameMode');

	new GameMode({
		name: 'MapHack',

		// If d2botmap is loaded, we want to load the maphack
		active: () => getScript('d2botmap.dbj'),

		// If this is the desired mode, what we do?
		handler: function () {
			load("tools/mapthread.js");
			load("tools/ToolsThread.js");

			while (true) {
				delay(1000);
			}
		},

		// just a normal priority
		prio: 0,
	})

})(module, require);