(function (module, require) {

	const Promise = require('../Promise');
	const GameData = require('../GameData');
	const Pickit = require('../Pickit');


	let bestSkills = [];
	(function () {
		let level = me.charlvl;

		// Recalculate everything when we are lvl up
		const promiser = () => new Promise(resolve => me.charlvl !== level && resolve(getTickCount()))
			.then((time) => // First wait 4 seconds
				new Promise(resolve => getTickCount() - time > 1e4 && resolve())
					.then(calculateSkills)
			);

		const calculateSkills = function () {
			promiser(); // Set the promise up.

			bestSkills = GameData.mostUsedSkills(true).map(sk => {
				// We want to know some stuff of the skill
				return {
					skillId: sk.skillId,
					used: sk.used,
					type: GameData.damageTypes[getBaseStat('skills', sk.skillId, 'EType')],
				}
			});
		};
		calculateSkills();
	}).call();

	const AutoEquip = require('../AutoEquip');

	Pickit.hooks.push(
		new AutoEquip({
			id: 'AutoEquip',
			formula: function (item) {
				const skills = () => {
						let val = item.getStatEx(sdk.stats.Allskills) + item.getStatEx(sdk.stats.Addclassskills, me.classid);

						// Calculate imported skill tabs.
						const tabs = [],
							char = sdk.skillTabs[['amazon', 'sorc', 'necro', 'paladin', 'barb', 'druid', 'assassin'][me.classid]];

						// Loop over all skill tabs of this char
						// And push every skill that has a tab
						Object.keys(char).forEach(types => char[types].skills.some(sk => bestSkills.find(bsk => bsk.skillId === sk)) && tabs.push(char[types].id));

						// Sum total value of all tabs
						val += tabs
							.filter((v, i, s) => s.indexOf(v) === i) // Filter to only have uniques (shouldnt happen, better safe as sorry)
							.reduce((a, tab) => a + item.getStatEx(sdk.stats.AddskillTab, tab), 0); // Sum them

						// Take care of specific + skills
						val += bestSkills.reduce((a, c) => a
							+ item.getStatEx(sdk.stats.Addclassskills, c) // + skills on item
							+ item.getStatEx(sdk.stats.Nonclassskill, c) // + o skills. Dont think it will happen, but, we wouldnt mind if it did happen
							, 0);

						return val * 10; // Boost the value, +1 skills are worth allot
					}, // get all skills

					// Take care of the elemental damage of your best skill. (facets/eschutas/the lot)
					elementDmg = () => bestSkills.reduce(function (a, c) {
						if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Mastery')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Mastery']); // + skill damage
						if (sdk.stats.hasOwnProperty('Passive' + c.type + 'Pierce')) a += item.getStatEx(sdk.stats['Passive' + c.type + 'Pierce']); // - enemy resistance
						return a;
					}, 0),

					// ToDo; take in account the current resistance. Because at some point, enough is enough
					res = () => (item.getStatEx(sdk.stats.Fireresist)
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
					ctb = () => item.getStatEx(sdk.stats.Toblock /*ctb = chance to block*/),
					beltsize = () => !(item.code === "lbl" || item.code === "vbl") ? !(item.code === "mbl" || item.code === "tbl") ? 4 : 3 : 2;

				const tiers = {
					helm: {
						magic: () => (skills() * 1000)
							+ (elementDmg() * 100)
							+ ((hpmp() + res()) * 100)
							+ def(),

						rare: () => (skills() * 10000)
							+ (elementDmg() * 1000)
							+ ((hpmp() + res()) * 1000)
							+ def()
					},

					amulet: {
						magic: () => (skills() * 1000)
							+ (res() * 1000)
							+ (strdex() * 100)
							+ (hpmp() * 10)
							+ (fcr() + fbr() + def()),

						rare: () => (skills() * 1000)
							+ (res() * 1000)
							+ (strdex() * 100)
							+ (hpmp() * 10)
							+ (ctb() * 100) // Safety crafted amulet
							+ (fcr() + fbr() + def()),


					},

					armor: {
						magic: () => (skills() * 10000)
							+ (res() * 1000)
							+ (elementDmg() * 1000)
							+ (strdex() * 1000)
							+ (hpmp() * 100)
							+ def(),

						rare: () => (skills() * 100000)
							+ (res() * 10000)
							+ (elementDmg() * 10000)
							+ (strdex() * 10000)
							+ (hpmp() * 1000)
							+ def(),
					},

					weapon: {
						magic: () => (skills() * 10000)
							+ (elementDmg() * 5000)
							+ (res() * 200)
							+ (hpmp() * 100)
							+ (strdex() * 10)
							+ fcr(),

						rare: () => ((skills()) * 10000)
							+ (elementDmg() * 5000)
							+ (res() * 1000)
							+ ((hpmp() + strdex()) * 1000)
							+ fcr()
					},
					shield: {
						magic: () => (res() * 10000)
							+ (elementDmg() * 5000)
							+ ((strdex() + vita()) * 1000)
							+ ((fbr() + ctb()) * 100)
							+ def(),

						rare: () => (res() * 100000)
							+ (elementDmg() * 50000)
							+ ((strdex() + vita()) * 10000)
							+ ((fbr() + ctb()) * 1000)
							+ def(),
					},

					_oldring: {
						magic: () => (res() * 1000)
							+ ((hpmp() + strdex()) * 100)
							+ fcr(),

						rare: () => (res() + fcr() * 10000)
							+ ((hpmp() + strdex()) * 1000),
					},

					ring: {
						magic: () => (fcr() * 1000) + (res() * 10) + ((hpmp() + strdex()) * 100),

						rare: () => (fcr() * 1000) + (res() * 10) + ((hpmp() + strdex()) * 100),
					},

					belt: {
						magic: () => (res() * 10000)
							+ (beltsize() * 10000)
							+ (strdex() * 1000)
							+ (hpmp() * 100)
							+ (fhr() * 10)
							+ def(),

						rare: () => (res() * 100000)
							+ (strdex() * 10000)
							+ (hpmp() * 1000)
							+ (fhr() * 10)
							+ def()
					},

					boots: {
						magic: () => (res() * 10000)
							+ ((strdex() + vita()) * 100)
							+ (hpmp() * 100)
							+ (frw() * 10)
							+ def(),

						rare: () => (res() * 100000)
							+ ((strdex() + vita()) * 10000)
							+ (hpmp() * 1000)
							+ (frw() * 10)
							+ def(),
					},

					gloves: {
						magic: () => ((res() + skills()) * 10000)
							+ (strdex() * 1000)
							+ (hpmp() * 100)
							+ def(),

						rare: () => ((res() + skills()) * 100000)
							+ (strdex() * 10000)
							+ (hpmp() * 1000)
							+ def(),
					},

				};

				const bodyLoc = item.getBodyLoc().first(); // always returns an array, as weapon/shield / rings have multiple slots

				if (!bodyLoc) return false; // Its not an equitable item


				const tierFuncs = Object.keys(tiers).map(key => tiers[key])[bodyLoc - 1];

				if (tierFuncs === undefined) {
					// throw Error('Should not happen?');
					return 0;
				}
				const [magicTier, rareTier] = [tierFuncs.magic, tierFuncs.rare];

				const quality = {
					lowquality: 1,
					normal: 2,
					superior: 3,
					magic: 4,
					set: 5,
					rare: 6,
					unique: 7,
					crafted: 8,
				};

				let bias = 1;

				// if eth
				if (item.getFlag(0x400000)) { //ToDo; Do something with bias
					bias += 0.10; // A fix'd negative point of 10%

					// And increase this negativity scale for its state, so a nearly broken item will be quicker replaced with something better
					bias += 1 - (1 / item.getStat(sdk.stats.Maxdurability) * item.getStat(sdk.stats.Durability));
				}

				if (item.isRuneword || item.quality >= quality.set) {
					if (typeof rareTier === 'function') {
						let tier = rareTier();
						// console.debug('rare tier -- '+item.name+ ' -- '+tier);
						return tier;
					}
					return 0;
				}
				// magical, or lower
				if (typeof magicTier === 'function') {
					// console.debug('magic tier -- '+item.name+ ' -- '+tier);
					return magicTier();
				}
				return 0;


			},
		})
	)

})(module, require);