(function (module, require) {

	const walkTo = require('../modules/WalkTo');
	const GameAnalyzer = require('../modules/GameAnalyzer');

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		const stones = [getUnit(2, 17), getUnit(2, 18), getUnit(2, 19), getUnit(2, 20), getUnit(2, 21)];

		const compoments = [
			// get the fucking scroll of whatever
			function () {
				if (me.getItem(524)) return;

				// Go to dark wood
				Pather.journeyTo(sdk.areas.DarkWood);

				const ps = getPresetUnit(sdk.areas.DarkWood, 2, 30).realCoords();
				// [].filter.constructor('return this')()['__whatever'] = new Line(me.x, me.y, ps.x, ps.y, 0x84, true);

				console.debug('Walk to preset =O');
				walkTo(ps);

				let tree = getUnit(2, 30);
				Misc.openChest(tree);
				delay(300);

				GameAnalyzer.skip.push(sdk.areas.DarkWood);


				Pickit.pickItem(getUnit(4, 524));

				Town.goToTown();
				const monkey = me.talkTo('akara');
				monkey && me.cancel();
			},

			// Stony field
			function () {

				Pather.journeyTo(sdk.areas.StonyField);

				const ps = getPresetUnit(sdk.areas.StonyField, 1, 737).realCoords();

				walkTo(ps);
				GameAnalyzer.skip.push(sdk.areas.StonyField);

				if (!me.getQuest(4, 4)) {
					while (!me.getQuest(4, 4)) {
						stones.filter(stone => !stone.mode).map(function (stone) {
							walkTo(stone);
							stone.click();
						});
					}
				}

				const portal = Misc.poll(() => Pather.getPortal(sdk.areas.Tristram), 10000, 40);
				if (!portal) {
					throw new Error('Failed somehow to do cain');
				}
			},

			function () {
				if (me.area !== sdk.areas.Tristram) return;

				if (!me.journeyToPreset(sdk.areas.Tristram, 2, 26, 0, 0, true, true)) {
					throw new Error("Failed to move to Cain's Gibbet");
				}

				let gibbet = getUnit(2, 26);

				if (!gibbet.mode) {
					Misc.openChest(gibbet);
				}
			}
		].forEach(fn => fn());

		// get teh scroll of whatever

	}


})(module, require);