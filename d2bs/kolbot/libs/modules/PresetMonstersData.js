(function (module, require) {
	const LocaleStringName = require('./LocaleStringID').LocaleStringName;
	const MonsterData = require('./MonsterData');
	/**
	 *  PresetMonsters[presetID]
	 */

	const PRESET_MON_COUNT = 734;
	const PRESET_SUPER_COUNT = 66;
	const PRESET_PLACE_COUNT = 37;

	var PresetMonsters = Array(PRESET_MON_COUNT + PRESET_SUPER_COUNT + PRESET_PLACE_COUNT);

	if (PresetMonsters) {
		let ind = 0;

		for (let i = 0; i < PRESET_MON_COUNT; i++, ind++) {
			PresetMonsters[ind] = MonsterData[i];
		}

		for (let i = 0; i < PRESET_SUPER_COUNT; i++, ind++) {
			let sourceMonster = MonsterData[getBaseStat('superuniques', i, 'class')];
			PresetMonsters[ind] = {};

			for (let k in sourceMonster) {
				PresetMonsters[ind] = sourceMonster[k];
			}

			PresetMonsters[ind].Index = ind;
			PresetMonsters[ind].LocaleString = getLocaleString(getBaseStat('superuniques', i, 'name'));
			PresetMonsters[ind].InternalName = LocaleStringName[getBaseStat('superuniques', i, 'name')];
			PresetMonsters[ind].Mods = ([
				getBaseStat('superuniques', i, 'Mod1'),
				getBaseStat('superuniques', i, 'Mod2'),
				getBaseStat('superuniques', i, 'Mod3')
			].filter(Boolean));

			(PresetMonsters[ind]);
		}

		PresetMonsters[805] = Object.create(MonsterData[267], {
			Index: {
				value: 805,
				enumerable: true,
			},
		});
		(PresetMonsters[805]);
	}

	PresetMonsters.findByName = function (whatToFind) {
		let matches = PresetMonsters.map(mon => [Math.min(whatToFind.diffCount(mon.LocaleString), whatToFind.diffCount(mon.InternalName)), mon]).sort((a, b) => a[0] - b[0]);

		return matches[0][1];
	};

//(PresetMonsters);
	module.exports = PresetMonsters;


})(module, require);
