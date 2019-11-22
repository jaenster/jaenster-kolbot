/**
 * @description An libary to mock an player.
 * @author Jaenster
 */


(function (module, require) {

	/** @class MockItem */
	const MockItem = require('MockItem');

	function MockPlayer(settings) {
		const getTotal = (...args) => {
			const onMe = this.getStat.apply(this, args);
			const onItems = settings.gear.reduce((a, c) => a + (c.getStat.apply(c, args) || 0), 0);
			return onMe + onItems;
		};
		Object.defineProperties(this, {
			maxhp: {
				get: function () {
					return getTotal(sdk.stats.Maxhp) * (1 + (getTotal(sdk.stats.MaxhpPercent) / 100));
				}
			},
			maxmp: {
				get: function () {
					return getTotal(sdk.stats.Maxmana) * (1 + (getTotal(sdk.stats.MaxmanaPercent) / 100));
				}
			},
		})
	}


	MockPlayer.fromUnit = function (unit = me, settings = {}) {
		const gear = settings.gear = MockItem.fromGear(); // get Gear
		Object.keys(unit).forEach(key => typeof unit[key] !== 'function' && typeof unit[key] !== 'object' && (settings[key] = unit[key]));

		const states = [];
		for (let x = 0; x < 1000; x++) {
			const zero = me.getStat(x, 0);
			zero && states.push([x, 0, zero]);
			for (let y = 1; y < 1000; y++) {
				const second = me.getStat(x, y);
				second && second !== zero && states.push([x, y, zero]);
			}
		}
		settings.overrides = {
			stat: states.map(stat => {
				const [major, minor, value] = stat;

				let gearStats = gear.reduce((acc, item) => acc + (item.getStat(major, minor) || 0), 0);
				let realValue;

				if ([sdk.stats.Maxhp, sdk.stats.Maxmana].includes(major)) {
					gearStats /= 256;
					const procentName = sdk.stats[Object.keys(sdk.stats).find(key => sdk.stats[key] === major) + 'Percent'];
					const otherStats = gear.reduce((acc, item) => acc + (item.getStat(procentName, minor) || 0), 0);

					// For max hp, we need to first remove the % life modifiers
					realValue = value / (100 + otherStats) * 100;

					// After that, we need to remove the remaining life given by items
					realValue -= gearStats;
				} else {
					realValue = value - gearStats;
				}
				return [major, minor, realValue];
			}).filter(x => x[2] && x[2] > 0)
		};
		new MockPlayer(settings);
	};

	module.exports = MockPlayer;
}).call(null, module, require);