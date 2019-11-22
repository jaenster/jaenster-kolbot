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
		socketedWith: [],

		overrides: {stats: {}},
	};

	/**
	 * @static fromItem
	 * @static fromGear
	 *
	 * @param settings
	 * @constructor
	 */
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
			const [major, minor] = args;
			const getStat = () => {
				const found = this.overrides.stat.find(data => data.length > 2 && data[0] === major && data[1] === (minor || 0));
				if (found) return found[2]; // the value
				return 0;
			};
			let original = typeof this.base === 'object' && this.base.hasOwnProperty('getStat') && this.base.getStat.apply(this.base, args) || 0;
			if (major === sdk.stats.Levelreq) {
				// level requirements = the max counts
				const max = this.socketedWith.map(a.getStat.apply(a, args));
				max.push.apply(max, [original, getStat()]);
				return Math.max.apply(null)
			}

			const sockets = this.socketedWith.reduce((a, c) => a + c.getStat.apply(c, args), 0);
			const item = (getStat() || 0);
			// The rest -> just original + sockets + mocked item

			return original + sockets + item;
		};
		this.getItemsEx = function () {
			return this.socketedWith;
		};

		this.store = () => JSON.stringify(Object.keys(settings).reduce((a, key) => a[key] = this[key], {}));
	}

	MockItem.fromItem = function (item, settings = {}) {
		Object.keys(item).forEach(key => settings[key] = item[key]);
		settings.socketedWith = item.getItemsEx().map(item => MockItem.fromItem(item)) || []; // Mock its sockets too
		const stats = item.getStat(-1);
		settings.overrides = {
			stat: (stats || []).reduce((accumulator, stats) => {
				const [major, minor, value] = stats,
					socketable = item.getItemsEx().map(item => item.getStat(major, minor)).reduce((a, c) => a + c, 0) || 0;

				let realValue = value;
				if (major !== sdk.stats.Levelreq) {
					realValue = value - socketable;
				}

				if (realValue > 0) { // Only if this stat isn't given by a socketable
					accumulator.push([major, minor, value]);
				}
				return accumulator;
			}, [])
		};
		return new MockItem(settings);
	};

	MockItem.fromGear = function () {
		return me.getItemsEx()
			.filter(item => item.location === sdk.storage.Equipment
				|| (item.location === sdk.storage.Inventory && [603, 604, 605].indexOf(item.classid) > -1))
			.map(x => MockItem.fromItem(x));
	};

	module.exports = MockItem;

}).call(null, module, require);