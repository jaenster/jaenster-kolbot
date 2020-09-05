(function (module, require) {

	const AreaData = require('../../../modules/AreaData');
	const Pickit = require('../../../modules/Pickit');
	const Misc = require('../../../modules/Misc');
	const Pather = require('../../../modules/Pather');

	const dungeonOfArea = area => Object.keys(AreaData.dungeons).find(key => AreaData.dungeons[key].includes(area));
	/**
	 *
	 * @param {number} area
	 * @param {function(walkTo, Pather, Pickit, Misc)} handler
	 * @constructor
	 */
	function CustomDungeon(area, handler) {
		this.area = area;
		this._run = handler;
		CustomDungeon.instances.push([area, this]);
	}


	CustomDungeon.prototype.run = function() {
		return this._run.apply(this);
	};


	/** @type {[number, CustomDungeon][]} */
	CustomDungeon.instances = [];

	const map = new Map();
	/**
	 *
	 * @param {string} dungeon
	 * @returns {undefined}
	 */
	CustomDungeon.loadDungeon = function (dungeon) {
		if (!map.has(dungeon)) {
			console.debug('');
			// it has atleast undefined
			map.set(dungeon, undefined);

			// does the file exists?
			const fileList = dopen("libs/bots/autoplay/modules/Dungeons/").getFiles() || [];


			// if so, load it
			if (fileList.filter(file => file.endsWith(dungeon+'.js')).first()) {
				// while the dungeons dont actually export any value, its still handy to store it to know its loaded
				map.set(dungeon, require('./Dungeons/' + dungeon));
			};
		}

		// not used but we can use it
		return map.get(dungeon);
	};

	/**
	 *
	 * @param area
	 * @returns {undefined|CustomDungeon}
	 */
	CustomDungeon.getArea = function (area) {
		console.debug('Get custom area?');
		const dungeon = dungeonOfArea(area);
		console.debug('Dungeon? '+dungeon);
		CustomDungeon.loadDungeon(dungeon);

		// If no such custom dungeon exists, not much to do
		if (!map.has(dungeon)) return undefined;


		let findings = CustomDungeon.instances.find(([curArea]) => curArea === area);
		if (findings) return findings[1];
		return undefined;
	};



	module.exports = CustomDungeon;
})(module, require);