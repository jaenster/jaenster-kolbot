/**
 * @description An savable/transferable item you can test with as if it where real
 * @author Jaenster
 *
 */


(function (module, require) {

	const defaultSettings = {
		base: 0, // Can be an item it extends
		type: 4,
		classid: 0,
		mode: 0,
		name: 0,
		act: 0,
		gid: 0,
		x: 0,
		y: 0,
		targetx: 0,
		targety: 0,
		area: 0,
		hp: 0,
		hpmax: 0,
		mp: 0,
		mpmax: 0,
		stamina: 0,
		staminamax: 0,
		charlvl: 0,
		itemcount: 0,
		owner: 0,
		ownertype: 0,
		spectype: 0,
		direction: 0,
		uniqueid: 0,
		code: 0,
		prefix: 0,
		suffix: 0,
		prefixes: 0,
		suffixes: 0,
		prefixnum: 0,
		suffixnum: 0,
		prefixnums: 0,
		suffixnums: 0,
		fname: 0,
		quality: 0,
		node: 0,
		location: 0,
		sizex: 0,
		sizey: 0,
		itemType: 0,
		description: 0,
		bodylocation: 0,
		ilvl: 0,
		lvlreq: 0,
		gfx: 0,
		runwalk: 0,
		weaponswitch: 0,
		objtype: 0,
		islocked: 0,
		getColor: 0,

		overrides: {stats: {}},
	};

	function MockItem(settings = {}) {
		const self = this;
		if (typeof settings !== 'object' && settings) settings = {};
		settings = Object.assign({}, defaultSettings, settings);
	 	Object.keys(settings).forEach(k => this[k] = settings[k]);

		Object.keys(Unit.prototype).forEach(k => {
			typeof Unit.prototype === 'function' && (this[k] = (...args) => {
				Unit.prototype.apply(this, args);
			})
		});

		this.getStat = function (...args) {
			let original = typeof self.base === 'object' && self.base.hasOwnProperty('getStat') && self.base.getStat.apply(self.base, args) || 0;
			print(self.base);
			print('-> '+args.join(','));
			print(original);
			return original + (function () {
				const [id, secondary] = args;

				if (self.overrides.stat.hasOwnProperty(id)) {
					const found = self.overrides.stat[id].find(data => {
						return data.first() === (secondary || 0);
					});
					print(found);
					if (found) return found.last();
				}
				return 0;
			}).call();
		}
	}

	MockItem.runewords = {};
	MockItem.runewords.Enigma = (function () {
		const settings = {overrides: {stat: {}}};
		settings.overrides.stat[sdk.stats.Allskills] = [[0, 2]];
		settings.overrides.stat[sdk.stats.Fastermovevelocity] = [[0, 45]];
		settings.overrides.stat[sdk.stats.Nonclassskill] = [[54, 1]];
		settings.overrides.stat[sdk.stats.Armorclass] = [[0, 775]];
		settings.overrides.stat[sdk.stats.PerLevelStrength] = [[0, 6]];
		settings.overrides.stat[sdk.stats.MaxhpPercent] = [[0, 5]];
		settings.overrides.stat[sdk.stats.Damageresist] = [[0, 8]];
		settings.overrides.stat[sdk.stats.Healafterkill] = [[0, 14]];
		settings.overrides.stat[sdk.stats.Damagetomana] = [[0, 15]];
		settings.overrides.stat[sdk.stats.PerLevelFindMagic] = [[0, 8]];
		settings.overrides.stat[sdk.stats.Levelreq] = [0, 65];
		return settings;
	}).call();

	MockItem.fromItem = function (item,settings = {}) {
		settings = {overrides: {stat: {}}};

		for (let i = 0; i < 1000; i++) {
			let first = item.getStat(i, 0);
			for (let y = 0; y < 1000; y++) {
				const stat = item.getStat(i, y);
				const stats = [];
				if (stat && (y === 0 || stat !== first)) stats.push([y,stat]);
				stats.length && (settings.overrides.stat[i] = stats);
			}
		}
		print(settings);

		return new MockItem(settings);
	};


	Object.keys(MockItem.runewords).forEach(key => {
		return Object.defineProperty(MockItem.runewords[key], 'newInstance', {
			get: function () {
				return function () {
					return MockItem.runewords[key].hasOwnProperty('__cache') && MockItem.runewords[key].__cache || (MockItem.runewords[key].__cache = new MockItem(MockItem.runewords[key]))
				}
			}
		});
	});

	module.exports = MockItem;

}).call(null, module, require);