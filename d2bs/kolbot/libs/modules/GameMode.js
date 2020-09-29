(function(globalThis, module, require) {

	function GameMode(obj = {active: () => false, name: 'script', prio: 0, handler: () => {}}) {
		Object.assign(this, obj);
		console.debug(this.active.toSource());
		GameMode.instances.push(this);
	}
	GameMode.instances = [];

	// default.dbj replacement (so everything is within the libs
	globalThis['OnceLoaded'] = function () {

		// Load game modes
		const fileList = dopen("libs/GameModes").getFiles();
		console.debug(fileList);

		Array.isArray(fileList) && fileList
			.filter(file => file.endsWith('.js'))
			.map(file => file.substr(0,file.length-3))
			.forEach(x => require('../gamemodes/'+x));


		GameMode.instances.sort((a,b)=> a.prio-b.prio);

		// wait until game is ready
		while (!me.gameReady) {
			delay(50);
		}

		// find the right bot script to run
		const mode = GameMode.instances.find(el => el.active());
		console.debug('GameMode: '+ mode.name);
		mode.handler();
	};

	module.exports = GameMode;

})([].filter.constructor('return this')(),module, require);