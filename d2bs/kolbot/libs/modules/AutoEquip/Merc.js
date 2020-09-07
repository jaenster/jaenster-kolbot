(function (module, require) {


	const Pickit = require('../Pickit');

	const AutoEquip = require('../AutoEquip');


	const mercAutoEquip = new AutoEquip({
		want: function () {

		},
		// Dont shop for merc items
		shop: function () {
			return []
		},

		formula: function (item) {

			const res = () => (item.getStatEx(sdk.stats.Fireresist)
					+ item.getStatEx(sdk.stats.Coldresist)
					+ item.getStatEx(sdk.stats.Lightresist)
				),
				strdex = () => item.getStatEx(sdk.stats.Strength)
					+ item.getStatEx(sdk.stats.Dexterity),
				vita = () => item.getStatEx(sdk.stats.Vitality),
				hpmp = () => item.getStatEx(sdk.stats.Maxhp)
					+ item.getStatEx(sdk.stats.Maxmana)
					+ item.getStatEx(sdk.stats.PerLevelHp) / 2048 * me.charlvl
					+ item.getStatEx(sdk.stats.PerLevelMana) / 2048 * me.charlvl,
				fcr = () => item.getStatEx(sdk.stats.Fastercastrate),
				fbr = () => item.getStatEx(sdk.stats.Fasterblockrate),
				def = () => item.getStatEx(sdk.stats.Armorclass /*defense*/),
				fhr = () => item.getStatEx(sdk.stats.Fastergethitrate /* fhr*/),
				frw = () => item.getStatEx(sdk.stats.Fastermovevelocity /* fwr*/),
				ll = () => item.getStatEx(sdk.stats.LifeLeech),
				medAura = () => item.getStatEx(sdk.stats.SkillOnAura, sdk.skills.Meditation),
				ias = () => item.getStatEx(sdk.stats.Fasterattackrate/*ias*/),
				maxdmg = () => item.getStatEx(sdk.stats.SecondaryMaxdamage),
				skills = () => item.getStatEx(sdk.stats.Allskills);

			const tiers = {
				helm: {
					magic: () => (ll() * 10000)
						+ (skills() * 10000)
						+ (ias() * 1000)
						+ (strdex() * 100)
						+ def(),

					rare: () => (ll() * 100000)
						+ (skills() * 100000)
						+ (ias() * 10000)
						+ (strdex() * 1000)
						+ def()
				},

				// place holder, dont remove
				amulet: {},

				armor: {
					magic: () => (skills() * 10000)
						+ (ias() * 1000)
						+ (res() * 100)
						+ def(),

					rare: () => (skills() * 100000)
						+ (ias() * 10000)
						+ (res() * 1000)
						+ def(),
				},

				weapon: {
					magic: () => (ll() * 10000)
						+ (ias() * 1000)
						+ (res() * 100)
						+ maxdmg(),

					rare: () => (medAura() * 1000000)
						+ (ll() * 100000)
						+ (ias() * 10000)
						+ (res() * 1000)
						+ maxdmg()
				},
			};

			const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots
			if (!bodyLoc) return 0; // Its not an equitable item
			if (![sdk.body.RightArm, sdk.body.Torso, sdk.body.Head].includes(bodyLoc)) return 0; // not equipable for a merc

			const tierFuncs = Object.keys(tiers).map(key => tiers[key])[bodyLoc - 1];

			if (tierFuncs === undefined) {
				// throw Error('Should not happen?');
				return 0;
			}
			const [magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

			const quality = {lowquality: 1, normal: 2, superior: 3, magic: 4, set: 5, rare: 6, unique: 7, crafted: 8,};

			if (item.isRuneword || item.quality >= quality.set) {
				return typeof rareTier === 'function' ? rareTier() : 0;
			}

			// magical, or lower
			return typeof magicTier === 'function' ? magicTier() : 0;

		}
	});

	Object.defineProperty(mercAutoEquip, 'reference', {
		get: function () {
			return me.getMerc();
		}
	});

	Pickit.hooks.push(mercAutoEquip);


	module.exports = mercAutoEquip;


})(module, require);