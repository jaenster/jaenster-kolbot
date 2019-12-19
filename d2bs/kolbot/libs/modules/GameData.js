/**
 *    @filename  GameData.js
 *    @author    Nishimura-Katsuo
 *    @desc      game data library
 */
(function (module, require) {
	const Skills = require('Skills');
	const Misc = require('Misc');
	const LocaleStringName = require('LocaleStringID').LocaleStringName;

	const MONSTER_INDEX_COUNT = 770;
	const PRESET_MON_COUNT = 734;
	const PRESET_SUPER_COUNT = 66;
	const PRESET_PLACE_COUNT = 37;
	const AREA_INDEX_COUNT = 137;
	const MISSILES_COUNT = 385;
	const SUPER = [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 1, 0, 1, 4, 0, 2, 3, 1, 0, 1, 1, 0, 0, 0, 1, 3, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 5, 1, 1, 1, 1, 3];
	const AREA_LOCALE_STRING = [5389, 5055, 5054, 5053, 5052, 5051, 5050, 5049, 5048, 5047, 5046, 5045, 5044, 5043, 5042, 5041, 5040, 5039, 5038, 5037, 5036, 5035, 5034, 5033, 5032, 5031, 5030, 5029, 5028, 5027, 5026, 5025, 5024, 5023, 5022, 5021, 5020, 5019, 5018, 788, 852, 851, 850, 849, 848, 847, 846, 845, 844, 843, 842, 841, 840, 839, 838, 837, 836, 835, 834, 833, 832, 831, 830, 829, 828, 827, 826, 826, 826, 826, 826, 826, 826, 825, 824, 820, 819, 818, 817, 816, 815, 814, 813, 812, 810, 811, 809, 808, 806, 805, 807, 804, 845, 844, 803, 802, 801, 800, 799, 798, 797, 796, 795, 790, 792, 793, 794, 791, 789, 22646, 22647, 22648, 22649, 22650, 22651, 22652, 22653, 22654, 22655, 22656, 22657, 22658, 22659, 22660, 22662, 21865, 21866, 21867, 22663, 22664, 22665, 22667, 22666, 5389, 5389, 5389, 5018];
	const MONSTER_KEYS = [
		['mon1', 'mon2', 'mon3', 'mon4', 'mon5', 'mon6', 'mon7', 'mon8', 'mon9', 'mon10'],
		['nmon1', 'nmon2', 'nmon3', 'nmon4', 'nmon5', 'nmon6', 'nmon7', 'nmon8', 'nmon9', 'nmon10'],
	][me.diff && 1]; // mon is for normal, nmon is for nm/hell, umon is specific to picking champion/uniques in normal

	let Experience = require('Experience');

	/**
	 *  MonsterData[classID]
	 *  .Index = Index of this monster
	 *  .Level = Level of this monster in normal (use GameData.monsterLevel to find monster levels)
	 *  .Ranged = if monster is ranged
	 *  .Rarity = weight of this monster in level generation
	 *  .Threat = threat level used by mercs
	 *  .Align = alignment of unit (determines what it will attack)
	 *  .Melee = if monster is melee
	 *  .NPC = if unit is NPC
	 *  .Demon = if monster is demon
	 *  .Flying = if monster is flying
	 *  .Boss = if monster is a boss
	 *  .ActBoss = if monster is act boss
	 *  .Killable = if monster can be killed
	 *  .Convertable = if monster is affected by convert or mind blast
	 *  .NeverCount = if not counted as a minion
	 *  .DeathDamage = explodes on death
	 *  .Regeneration = hp regeneration
	 *  .LocaleString = locale string index for getLocaleString
	 *  .ExperienceModifier = percent of base monster exp this unit rewards when killed
	 *  .Undead = 2 if greater undead, 1 if lesser undead, 0 if neither
	 *  .Drain = drain effectiveness percent
	 *  .Block = block percent
	 *  .Physical = physical resist
	 *  .Magic = magic resist
	 *  .Fire = fire resist
	 *  .Lightning = lightning resist
	 *  .Poison = poison resist
	 *  .Minions = array of minions that can spawn with this unit
	 *  .MinionCount.Min = minimum number of minions that can spawn with this unit
	 *  .MinionCount.Max = maximum number of minions that can spawn with this unit
	 */

	var MonsterData = Array(MONSTER_INDEX_COUNT);

	for (let i = 0; i < MonsterData.length; i++) {
		let index = i;
		MonsterData[i] = ({
			Index: index,
			ClassID: index,
			Level: getBaseStat('monstats', index, 'Level'), // normal only, nm/hell are determined by area's LevelEx
			Ranged: getBaseStat('monstats', index, 'RangedType'),
			Rarity: getBaseStat('monstats', index, 'Rarity'),
			Threat: getBaseStat('monstats', index, 'threat'),
			PetIgnore: getBaseStat('monstats', index, 'petignore'),
			Align: getBaseStat('monstats', index, 'Align'),
			Melee: getBaseStat('monstats', index, 'isMelee'),
			NPC: getBaseStat('monstats', index, 'npc'),
			Demon: getBaseStat('monstats', index, 'demon'),
			Flying: getBaseStat('monstats', index, 'flying'),
			Boss: getBaseStat('monstats', index, 'boss'),
			ActBoss: getBaseStat('monstats', index, 'primeevil'),
			Killable: getBaseStat('monstats', index, 'killable'),
			Convertable: getBaseStat('monstats', index, 'switchai'),
			NeverCount: getBaseStat('monstats', index, 'neverCount'),
			DeathDamage: getBaseStat('monstats', index, 'deathDmg'),
			Regeneration: getBaseStat('monstats', index, 'DamageRegen'),
			LocaleString: getLocaleString(getBaseStat('monstats', index, 'NameStr')),
			InternalName: LocaleStringName[getBaseStat('monstats', index, 'NameStr')],
			ExperienceModifier: getBaseStat('monstats', index, ['Exp', 'Exp(N)', 'Exp(H)'][me.diff]),
			Undead: (getBaseStat('monstats', index, 'hUndead') && 2) | (getBaseStat('monstats', index, 'lUndead') && 1),
			Drain: getBaseStat('monstats', index, ["Drain", "Drain(N)", "Drain(H)"][me.diff]),
			Block: getBaseStat('monstats', index, ["ToBlock", "ToBlock(N)", "ToBlock(H)"][me.diff]),
			Physical: getBaseStat('monstats', index, ["ResDm", "ResDm(N)", "ResDm(H)"][me.diff]),
			Magic: getBaseStat('monstats', index, ["ResMa", "ResMa(N)", "ResMa(H)"][me.diff]),
			Fire: getBaseStat('monstats', index, ["ResFi", "ResFi(N)", "ResFi(H)"][me.diff]),
			Lightning: getBaseStat('monstats', index, ["ResLi", "ResLi(N)", "ResLi(H)"][me.diff]),
			Cold: getBaseStat('monstats', index, ["ResCo", "ResCo(N)", "ResCo(H)"][me.diff]),
			Poison: getBaseStat('monstats', index, ["ResPo", "ResPo(N)", "ResPo(H)"][me.diff]),
			Minions: ([getBaseStat('monstats', index, 'minion1'), getBaseStat('monstats', index, 'minion2')].filter(mon => mon !== 65535)),
			GroupCount: ({
				Min: getBaseStat('monstats', index, 'MinGrp'),
				Max: getBaseStat('monstats', index, 'MaxGrp')
			}),
			MinionCount: ({
				Min: getBaseStat('monstats', index, 'PartyMin'),
				Max: getBaseStat('monstats', index, 'PartyMax')
			}),
			Velocity: getBaseStat('monstats', index, 'Velocity'),
			Run: getBaseStat('monstats', index, 'Run'),
			SizeX: getBaseStat('monstats', index, 'SizeX'),
			SizeY: getBaseStat('monstats', index, 'SizeY'),
		});
	}

	MonsterData.findByName = function (whatToFind) {
		let matches = MonsterData.map(mon => [Math.min(whatToFind.diffCount(mon.LocaleString), whatToFind.diffCount(mon.InternalName)), mon]).sort((a, b) => a[0] - b[0]);

		return matches[0][1];
	};

//(MonsterData);

	/**
	 *  PresetMonsters[presetID]
	 */

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

	/**
	 *  MissilesData
	 */

	var MissilesData = Array(MISSILES_COUNT);

	for (let i = 0; i < MissilesData.length; i++) {
		let index = i;
		MissilesData[i] = ({
			Index: index,
			ClassID: index,
			InternalName: getBaseStat('missiles', index, 'Missile'),
			Velocity: getBaseStat('missiles', index, 'Vel'),
			VelocityMax: getBaseStat('missiles', index, 'MaxVel'),
			Acceleration: getBaseStat('missiles', index, 'Accel'),
			Range: getBaseStat('missiles', index, 'Range'),
			Size: getBaseStat('missiles', index, 'Size'),
		});
	}

//(MissilesData);

	/**
	 *  AreaData[areaID]
	 *  .Super = number of super uniques present in this area
	 *  .Index = areaID
	 *  .Act = act this area is in [0-4]
	 *  .MonsterDensity = value used to determine monster population density
	 *  .ChampionPacks.Min = minimum number of champion or unique packs that spawn here
	 *  .ChampionPacks.Max = maximum number of champion or unique packs that spawn here
	 *  .Waypoint = number in waypoint menu that leads to this area
	 *  .Level = level of area (use GameData.areaLevel)
	 *  .Size.x = width of area
	 *  .Size.y = depth of area
	 *  .Monsters = array of monsters that can spawn in this area
	 *  .LocaleString = locale string index for getLocaleString
	 */

	var AreaData = new Array(AREA_INDEX_COUNT);

	for (let i = 0; i < AreaData.length; i++) {
		let index = i;
		AreaData[i] = ({
			Super: SUPER[index],
			Index: index,
			Act: getBaseStat('levels', index, 'Act'),
			MonsterDensity: getBaseStat('levels', index, ['MonDen', 'MonDen(N)', 'MonDen(H)'][me.diff]),
			ChampionPacks: ({
				Min: getBaseStat('levels', index, ['MonUMin', 'MonUMin(N)', 'MonUMin(H)'][me.diff]),
				Max: getBaseStat('levels', index, ['MonUMax', 'MonUMax(N)', 'MonUMax(H)'][me.diff])
			}),
			Waypoint: getBaseStat('levels', index, 'Waypoint'),
			Level: getBaseStat('levels', index, ['MonLvl1Ex', 'MonLvl2Ex', 'MonLvl3Ex'][me.diff]),
			Size: (() => {
				if (index === 111) { // frigid highlands doesn't specify size, manual measurement
					return {x: 210, y: 710};
				}

				if (index === 112) { // arreat plateau doesn't specify size, manual measurement
					return {x: 690, y: 230};
				}

				return {
					x: getBaseStat('leveldefs', index, ['SizeX', 'SizeX(N)', 'SizeX(H)'][me.diff]),
					y: getBaseStat('leveldefs', index, ['SizeY', 'SizeY(N)', 'SizeY(H)'][me.diff])
				};
			})(),
			Monsters: (MONSTER_KEYS.map(key => getBaseStat('levels', index, key)).filter(key => key !== 65535)),
			forEachMonster: function (cb) {
				if (typeof cb === 'function') {
					this.Monsters.forEach(monID => {
						cb(MonsterData[monID], MonsterData[monID].Rarity * (MonsterData[monID].GroupCount.Min + MonsterData[monID].GroupCount.Max) / 2);
					});
				}
			},
			forEachMonsterAndMinion: function (cb) {
				if (typeof cb === 'function') {
					this.Monsters.forEach(monID => {
						let rarity = MonsterData[monID].Rarity * (MonsterData[monID].GroupCount.Min + MonsterData[monID].GroupCount.Max) / 2;
						cb(MonsterData[monID], rarity, null);
						MonsterData[monID].Minions.forEach(minionID => {
							let minionrarity = MonsterData[monID].Rarity * (MonsterData[monID].MinionCount.Min + MonsterData[monID].MinionCount.Max) / 2 / MonsterData[monID].Minions.length;
							cb(MonsterData[minionID], minionrarity, MonsterData[monID]);
						});
					});
				}
			},
			LocaleString: getLocaleString(AREA_LOCALE_STRING[index]),
			InternalName: LocaleStringName[AREA_LOCALE_STRING[index]],
		});
	}

	AreaData.findByName = function (whatToFind) {
		let matches = AreaData.map(area => [Math.min(whatToFind.diffCount(area.LocaleString), whatToFind.diffCount(area.InternalName)), area]).sort((a, b) => a[0] - b[0]);

		return matches[0][1];
	};

//(AreaData);


	const Potions = {
		587: { // minorhealingpotion
			effect: [45, 30, 30, 45, 60, 30, 45],
			cost: 30,
			duration: 7.68
		},
		588: { // lighthealingpotion
			effect: [90, 60, 60, 90, 120, 60, 90],
			cost: 67,
			duration: 6.4
		},
		589: { // healingpotion
			effect: [150, 100, 100, 150, 200, 100, 150],
			cost: 112,
			duration: 6.84
		},
		590: { // greaterhealingpotion
			effect: [270, 180, 180, 270, 360, 180, 270],
			cost: 225,
			duration: 7.68
		},
		591: { // superhealingpotion
			effect: [480, 320, 320, 480, 640, 320, 480],
			cost: undefined,
			duration: 10.24
		},
		592: { // minormanapotion
			effect: [30, 40, 40, 30, 20, 40, 30],
			cost: 60,
			duration: 5.12
		},
		593: { // lightmanapotion
			effect: [60, 80, 80, 60, 40, 80, 60],
			cost: 135,
			duration: 5.12
		},
		594: { // manapotion
			effect: [120, 160, 160, 120, 80, 160, 120],
			cost: 270,
			duration: 5.12
		},
		595: { // greatermanapotion
			effect: [225, 300, 300, 225, 150, 300, 225],
			cost: 450,
			duration: 5.12
		},
		596: { // supermanapotion
			effect: [375, 500, 500, 375, 250, 500, 375],
			cost: undefined,
			duration: 5.12
		},
		515: { // normal rv
			effect: [35, 35, 35, 35, 35, 35, 35],
			cost: undefined,
			duration: 0.04, // instant refill (1 frame time)
			recipe: [
				[
					589, 589, 589,
					594, 594, 594,
					item => item.itemType === 91 /*chipped gem*/
				]
			]
		},
		516: { // full rv
			effect: [100, 100, 100, 100, 100, 100, 100],
			cost: undefined,
			duration: 0.04, // instant refill (1 frame time)
			recipe: [ // Not doing anything with this, but. We can in the future
				// Recipe is either an classid, or an function that returns true on the correct item
				[
					515, 515, 515 // 3 normal rv's
				],
				[	// 3 normal hp pots & 3 normal mp pots & a gem
					589, 589, 589,
					594, 594, 594,
					item => item.itemType === 93 /*std gem*/
				],
			]
		}
	};

//(Potions);

	const MandatoryQuests = [
		sdk.quests.SistersToTheSlaughter, // kill Andy
		sdk.quests.TheHoradricStaff, // make staff
		sdk.quests.TheArcaneSanctuary, // go to arcane and find portal to tombs
		sdk.quests.TheSummoner, // kill The Summoner
		sdk.quests.TheSevenTombs, // kill Duriel
		sdk.quests.KhalimsWill, // depends, if you have wp to meph not needed
		sdk.quests.TheBlackenedTemple, // kill Travincal
		sdk.quests.TheGuardian, // kill Meph
		sdk.quests.TerrorsEnd, // kill Diablo
		sdk.quests.RiteOfPassage, // kill Ancients (depends on charlvl)
		sdk.quests.EveOfDestruction // kill Baal
	];

	const RewardedQuests = [
		sdk.quests.DenOfEvil, // 1 skill + 1 respec
		sdk.quests.RadamentsLair, // 1 skill
		sdk.quests.TheGoldenBird, // 20 life
		sdk.quests.LamEsensTome, // 5 stat pts
		sdk.quests.TheFallenAngel, // 2 skills
		sdk.quests.HellsForge, // 1 rune
		sdk.quests.SiegeOnHarrogath, // 1 socket
		sdk.quests.PrisonOfIce // 10@ res
	];

	const Quests = [];
	Quests.MandatoryQuests = MandatoryQuests;
	Quests.RewardedQuests = RewardedQuests;

	Quests.questScore = function (q) {
		var score = 0;
		var highestAct = me.highestAct;
		if (!me.getQuest(q.index, 0) && highestAct >= q.act) {
			// we did not complete the quest
			score += q.mandatory ? 2 : 0;
			score += q.reward ? 2 : 0;

			if (q.mandatory || q.reward) {
				// the quest is mandatory or reward
				// the higher the act is, the less this quest is good to do, aka do earliest quest
				score += q.act > 0 ? 1 / q.act : 0;
				var questEffort = q.areas.reduce((acc, a) => acc + GameData.areaEffort(a), 0);
				score += questEffort > 0 ? 1 / questEffort : 0;

				var bossEffort = q.bosses.reduce((acc, boss) => acc + GameData.monsterEffort(boss, q.areas.last()).effort, 0);
				score += bossEffort > 0 ? 1 / bossEffort : 0;
				// monsterEffort: function (unit, areaID, skillDamageInfo, parent = undefined, preattack = false, all = false)
			}
		} else if (highestAct < q.act) {
			// we can not access the quest act
		} else {
			// we have done this quest
		}


		return score;
	}

	Quests.actForQuest = function (q) {
		switch (true) {
			case (q >= sdk.quests.SpokeToWarriv && q <= sdk.quests.AbleToGotoActII) || q == sdk.quests.SecretCowLevel:
				return 1;
			case (q >= sdk.quests.SpokeToJerhyn && q <= sdk.quests.AbleToGotoActIII):
				return 2;
			case (q >= sdk.quests.SpokeToHratli && q <= sdk.quests.AbleToGotoActIV):
				return 3;
			case (q >= sdk.quests.SpokeToTyrael && q <= sdk.quests.AbleToGotoActV):
				return 4;
			case (q >= sdk.quests.SiegeOnHarrogath && q < sdk.quests.SecretCowLevel):
				return 5;
		}
		return undefined;
	}

	Quests.areasForQuest = function (q) {
		switch (q) {
			case sdk.quests.SpokeToWarriv:
				return [sdk.areas.RogueEncampment];

			case sdk.quests.DenOfEvil:
				return [sdk.areas.DenOfEvil];

			case sdk.quests.SistersBurialGrounds:
				return [sdk.areas.BurialGrounds];

			case sdk.quests.TheSearchForCain:
				// scroll, stones, trist
				return [sdk.areas.DarkWood, sdk.areas.StonyField, sdk.areas.Tristram];

			case sdk.quests.ForgottenTower:
				return [sdk.areas.TowerCellarLvl5];

			case sdk.quests.ToolsOfTheTrade:
				return [sdk.areas.Barracks];

			case sdk.quests.SistersToTheSlaughter:
				return [sdk.areas.CatacombsLvl4];

			case sdk.quests.AbleToGotoActII:
				return [sdk.areas.RogueEncampment];

			case sdk.quests.SpokeToJerhyn:
				return [sdk.areas.LutGholein];

			case sdk.quests.RadamentsLair:
				return [sdk.areas.A2SewersLvl3];

			case sdk.quests.TheHoradricStaff:
				// cube, staff, amu
				return [sdk.areas.HallsOfDeadLvl2, sdk.areas.MaggotLairLvl3, sdk.areas.ClawViperTempleLvl2];

			case sdk.quests.TheTaintedSun:
				// amu + speak to Drognan
				return [sdk.areas.ClawViperTempleLvl2, sdk.areas.LutGholein];

			case sdk.quests.TheArcaneSanctuary:
				return [sdk.areas.ArcaneSanctuary];

			case sdk.quests.TheSummoner:
				return [sdk.areas.ArcaneSanctuary];

			case sdk.quests.TheSevenTombs:
				return [sdk.areas.DurielsLair];

			case sdk.quests.AbleToGotoActIII:
				return [sdk.areas.LutGholein];

			case sdk.quests.SpokeToHratli:
				return [sdk.areas.KurastDocktown];

			case sdk.quests.TheGoldenBird:
				return []; // any, kill an elite and have a chance that it drops golden bird

			case sdk.quests.BladeOfTheOldReligion:
				return [sdk.areas.FlayerJungle];

			case sdk.quests.KhalimsWill:
				// eye, brain, heart, flail
				return [sdk.areas.SpiderCavern, sdk.areas.FlayerDungeonLvl3, sdk.areas.A3SewersLvl2, sdk.areas.Travincal];

			case sdk.quests.LamEsensTome:
				return [sdk.areas.RuinedTemple];

			case sdk.quests.TheBlackenedTemple:
				return [sdk.areas.Travincal];

			case sdk.quests.TheGuardian:
				return [sdk.areas.DuranceOfHateLvl3];

			case sdk.quests.AbleToGotoActIV:
				// meph red portal
				return [sdk.areas.DuranceOfHateLvl3];

			case sdk.quests.SpokeToTyrael:
				return [sdk.areas.PandemoniumFortress];

			case sdk.quests.TheFallenAngel:
				return [sdk.areas.PlainsOfDespair];

			case sdk.quests.HellsForge:
				return [sdk.areas.RiverOfFlame];

			case sdk.quests.TerrorsEnd:
				return [sdk.areas.ChaosSanctuary];

			case sdk.quests.AbleToGotoActV:
				return [sdk.areas.PandemoniumFortress];

			case sdk.quests.SiegeOnHarrogath:
				return [sdk.areas.BloodyFoothills];

			case sdk.quests.RescueonMountArreat:
				return [sdk.areas.FrigidHighlands];

			case sdk.quests.PrisonOfIce:
				// anya and speak to malah
				return [sdk.areas.FrozenRiver, sdk.areas.Harrogath];

			case sdk.quests.BetrayalOfHaggorath:
				return [sdk.areas.NihlathaksTemple];

			case sdk.quests.RiteOfPassage:
				return [sdk.areas.ArreatSummit];

			case sdk.quests.EveOfDestruction:
				return [sdk.areas.ThroneOfDestruction, sdk.areas.WorldstoneChamber];

			case sdk.quests.SecretCowLevel:
				// get wirt and open portal
				return [sdk.areas.Tristram, sdk.areas.RogueEncampment];
		}
		return [];
	}

	Quests.bossForQuest = function (q) {
		switch (q) {
			case sdk.quests.SistersBurialGrounds:
				return [sdk.monsters.Bloodraven];

			case sdk.quests.ForgottenTower:
				return [sdk.monsters.TheCountess];

			case sdk.quests.SistersToTheSlaughter:
				return [sdk.monsters.Andariel];

			case sdk.quests.RadamentsLair:
				return [sdk.monsters.Radament];

			case sdk.quests.TheSummoner:
				return [sdk.monsters.Summoner];

			case sdk.quests.TheSevenTombs:
				return [sdk.monsters.Duriel];

			case sdk.quests.KhalimsWill:
			case sdk.quests.TheBlackenedTemple:
				return [sdk.monsters.GelebFlamefinger, sdk.monsters.IsmailVilehand, sdk.monsters.ToorcIcefist];

			case sdk.quests.TheGuardian:
				return [sdk.monsters.Mephisto];

			case sdk.quests.TheFallenAngel:
				return [sdk.monsters.Izual];

			case sdk.quests.TerrorsEnd:
				return [sdk.monsters.Diablo1];

			case sdk.quests.SiegeOnHarrogath:
				return []; // TODO shenk id ?

			case sdk.quests.BetrayalOfHaggorath:
				return [sdk.monsters.Nihlathak];

			case sdk.quests.RiteOfPassage:
				return [sdk.monsters.Ancient1, sdk.monsters.Ancient2, sdk.monsters.Ancient3];

			case sdk.quests.EveOfDestruction:
				return [sdk.monsters.Crab];

			case sdk.quests.SecretCowLevel:
				return [sdk.monsters.TheCowKing];
		}
		return [];
	}

	for (var q = sdk.quests.SpokeToWarriv; q <= sdk.quests.SecretCowLevel; q++) {
		Quests[q] = {
			index: q,
			name: Object.keys(sdk.quests).find(x => sdk.quests[x] == q),
			mandatory: MandatoryQuests.indexOf(q) > -1,
			reward: RewardedQuests.indexOf(q) > -1,
			areas: Quests.areasForQuest(q),
			act: Quests.actForQuest(q),
			bosses: Quests.bossForQuest(q),
			do: ((q) => () => require('../bots/Questing').doQuest(q))(q)
		}
	}

//(Quests);








	function isAlive(unit) {
		return Boolean(unit && unit.hp);
	}

	function isEnemy(unit) {
		return Boolean(unit && isAlive(unit) && unit.getStat(172) !== 2 && typeof unit.classid === 'number' && MonsterData[unit.classid].Killable);
	}

	function onGround(item) {
		if (item.mode === 3 || item.mode === 5) {
			return true;
		}

		return false;
	}

	function itemTier(item) {
		if (getBaseStat(0, item.classid, 'code') === getBaseStat(0, item.classid, 'ubercode')) {
			return 1;
		}

		if (getBaseStat(0, item.classid, 'code') === getBaseStat(0, item.classid, 'ultracode')) {
			return 2;
		}

		return 0;
	}

	const GameData = {
		townAreas: [0, 1, 40, 75, 103, 109],
		HPLookup: [["1", "1", "1"], ["7", "107", "830"], ["9", "113", "852"], ["12", "120", "875"], ["15", "125", "897"], ["17", "132", "920"], ["20", "139", "942"], ["23", "145", "965"], ["27", "152", "987"], ["31", "157", "1010"], ["35", "164", "1032"], ["36", "171", "1055"], ["40", "177", "1077"], ["44", "184", "1100"], ["48", "189", "1122"], ["52", "196", "1145"], ["56", "203", "1167"], ["60", "209", "1190"], ["64", "216", "1212"], ["68", "221", "1235"], ["73", "228", "1257"], ["78", "236", "1280"], ["84", "243", "1302"], ["89", "248", "1325"], ["94", "255", "1347"], ["100", "261", "1370"], ["106", "268", "1392"], ["113", "275", "1415"], ["120", "280", "1437"], ["126", "287", "1460"], ["134", "320", "1482"], ["142", "355", "1505"], ["150", "388", "1527"], ["158", "423", "1550"], ["166", "456", "1572"], ["174", "491", "1595"], ["182", "525", "1617"], ["190", "559", "1640"], ["198", "593", "1662"], ["206", "627", "1685"], ["215", "661", "1707"], ["225", "696", "1730"], ["234", "729", "1752"], ["243", "764", "1775"], ["253", "797", "1797"], ["262", "832", "1820"], ["271", "867", "1842"], ["281", "900", "1865"], ["290", "935", "1887"], ["299", "968", "1910"], ["310", "1003", "1932"], ["321", "1037", "1955"], ["331", "1071", "1977"], ["342", "1105", "2000"], ["352", "1139", "2030"], ["363", "1173", "2075"], ["374", "1208", "2135"], ["384", "1241", "2222"], ["395", "1276", "2308"], ["406", "1309", "2394"], ["418", "1344", "2480"], ["430", "1379", "2567"], ["442", "1412", "2653"], ["454", "1447", "2739"], ["466", "1480", "2825"], ["477", "1515", "2912"], ["489", "1549", "2998"], ["501", "1583", "3084"], ["513", "1617", "3170"], ["525", "1651", "3257"], ["539", "1685", "3343"], ["552", "1720", "3429"], ["565", "1753", "3515"], ["579", "1788", "3602"], ["592", "1821", "3688"], ["605", "1856", "3774"], ["618", "1891", "3860"], ["632", "1924", "3947"], ["645", "1959", "4033"], ["658", "1992", "4119"], ["673", "2027", "4205"], ["688", "2061", "4292"], ["702", "2095", "4378"], ["717", "2129", "4464"], ["732", "2163", "4550"], ["746", "2197", "4637"], ["761", "2232", "4723"], ["775", "2265", "4809"], ["790", "2300", "4895"], ["805", "2333", "4982"], ["821", "2368", "5068"], ["837", "2403", "5154"], ["853", "2436", "5240"], ["868", "2471", "5327"], ["884", "2504", "5413"], ["900", "2539", "5499"], ["916", "2573", "5585"], ["932", "2607", "5672"], ["948", "2641", "5758"], ["964", "2675", "5844"], ["982", "2709", "5930"], ["999", "2744", "6017"], ["1016", "2777", "6103"], ["1033", "2812", "6189"], ["1051", "2845", "6275"], ["1068", "2880", "6362"], ["1085", "2915", "6448"], ["1103", "2948", "6534"], ["1120", "2983", "6620"], ["1137", "3016", "6707"], ["10000", "10000", "10000"]],
		monsterLevel: function (monsterID, areaID) {
			return me.diff ? AreaData.hasOwnProperty(areaID) && AreaData[areaID].Level : MonsterData.hasOwnProperty(monsterID) && MonsterData[monsterID].Level; // levels on nm/hell are determined by area, not by monster data
		},
		monsterExp: function (monsterID, areaID, adjustLevel = 0) {
			return Experience.monsterExp[Math.min(Experience.monsterExp.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * MonsterData[monsterID].ExperienceModifier / 100;
		},
		eliteExp: function (monsterID, areaID) {
			return this.monsterExp(monsterID, areaID, 2) * 3;
		},
		monsterAvgHP: function (monsterID, areaID, adjustLevel = 0) {
			return this.HPLookup[Math.min(this.HPLookup.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * (getBaseStat('monstats', monsterID, 'minHP') + getBaseStat('monstats', monsterID, 'maxHP')) / 200;
		},
		monsterMaxHP: function (monsterID, areaID, adjustLevel = 0) {
			return this.HPLookup[Math.min(this.HPLookup.length - 1, this.monsterLevel(monsterID, areaID) + adjustLevel)][me.diff] * getBaseStat('monstats', monsterID, 'maxHP') / 100;
		},
		eliteAvgHP: function (monsterID, areaID) {
			return (6 - me.diff) / 2 * this.monsterAvgHP(monsterID, areaID, 2);
		},
		averagePackSize: monsterID => (MonsterData[monsterID].GroupCount.Min + MonsterData[monsterID].MinionCount.Min + MonsterData[monsterID].GroupCount.Max + MonsterData[monsterID].MinionCount.Max) / 2,
		areaLevel: function (areaID) {
			let levels = 0, total = 0;

			if (me.diff) { // levels on nm/hell are determined by area, not by monster data
				return AreaData[areaID].Level;
			}

			AreaData[areaID].forEachMonsterAndMinion((mon, rarity) => {
				levels += mon.Level * rarity;
				total += rarity;
			});

			return Math.round(levels / total);
		},
		areaImmunities: function (areaID) {
			let resists = {Physical: 0, Magic: 0, Fire: 0, Lightning: 0, Cold: 0, Poison: 0};

			AreaData[areaID].forEachMonsterAndMinion(mon => {
				for (let k in resists) {
					resists[k] = Math.max(resists[k], mon[k]);
				}
			});

			return Object.keys(resists).filter(key => resists[key] >= 100);
		},
		levelModifier: function (clvl, mlvl) {
			let bonus;

			if (clvl < 25 || mlvl < clvl) {
				bonus = Experience.expCurve[Math.min(20, Math.max(0, Math.floor(mlvl - clvl + 10)))] / 255;
			} else {
				bonus = clvl / mlvl;
			}

			return bonus * Experience.expPenalty[Math.min(30, Math.max(0, Math.round(clvl - 69)))] / 1024;
		},
		multiplayerModifier: function (count) {
			if (!count) {
				let party = getParty(GameData.myReference);

				if (!party) {
					return 1;
				}

				count = 1;

				while (party.getNext()) {
					count++;
				}
			}

			return (count + 1) / 2;
		},
		partyModifier: function (playerID) {
			let party = getParty(GameData.myReference), partyid = -1, level = 0, total = 0;

			if (!party) {
				return 1;
			}

			partyid = party.partyid;

			do {
				if (party.partyid === partyid) {
					total += party.level;

					if (playerID === party.name || playerID === party.gid) {
						level = party.level;
					}
				}
			} while (party.getNext());

			return level / total;
		},
		killExp: function (playerID, monsterID, areaID) {
			let exp = this.monsterExp(monsterID, areaID), party = getParty(GameData.myReference), partyid = -1,
				level = 0, total = 0,
				gamesize = 0;

			if (!party) {
				return 0;
			}

			partyid = party.partyid;

			do {
				gamesize++;

				if (party.partyid === partyid) {
					total += party.level;

					if (playerID === party.name || playerID === party.gid) {
						level = party.level;
					}
				}
			} while (party.getNext());

			return Math.floor(exp * this.levelModifier(level, this.monsterLevel(monsterID, areaID)) * this.multiplayerModifier(gamesize) * level / total);
		},
		baseLevel: function (...skillIDs) {
			return skillIDs.reduce((total, skillID) => total + GameData.myReference.getSkill(skillID, 0), 0);
		},
		skillLevel: function (...skillIDs) {
			return skillIDs.reduce((total, skillID) => total + GameData.myReference.getSkill(skillID, 1), 0);
		},
		skillCooldown: function (skillID) {
			return getBaseStat('Skills', skillID, 'delay') !== -1;
		},
		stagedDamage: function (l, a, b, c, d, e, f, hitshift = 0, mult = 1) {
			if (l > 28) {
				a += f * (l - 28);
				l = 28;
			}

			if (l > 22) {
				a += e * (l - 22);
				l = 22;
			}

			if (l > 16) {
				a += d * (l - 16);
				l = 16;
			}

			if (l > 8) {
				a += c * (l - 8);
				l = 8;
			}

			a += b * (Math.max(0, l) - 1);

			return (mult * a) << hitshift;
		},
		damageTypes: ["Physical", "Fire", "Lightning", "Magic", "Cold", "Poison", "?", "?", "?", "Physical"], // 9 is Stun, but stun isn't an element
		synergyCalc: { // TODO: add melee skill damage and synergies - they are poop

			// sorc fire spells
			36: [47, 0.16, 56, 0.16],			// fire bolt
			41: [37, 0.13],	// inferno
			46: [37, 0.04, 51, 0.01],	// blaze
			47: [36, 0.14, 56, 0.14],			// fire ball
			51: [37, 0.04, 41, 0.01],	// fire wall
			52: [37, 0.09],						// enchant
			56: [36, 0.05, 47, 0.05],			// meteor
			62: [36, 0.03, 47, 0.03],			// hydra

			// sorc lightning spells
			38: [49, 0.06],						// charged bolt
			49: [38, 0.08, 48, 0.08, 53, 0.08], // lightning
			53: [38, 0.04, 48, 0.04, 49, 0.04], // chain lightning

			// sorc cold spells
			39: [44, 0.15, 45, 0.15, 55, 0.15, 59, 0.15, 64, 0.15],	// ice bolt
			44: [59, 0.10, 64, 0.10],			// frost nova
			45: [39, 0.08, 59, 0.08, 64, 0.08],	// ice blast
			55: [39, 0.05, 45, 0.05, 64, 0.05],	// glacial spike
			59: [39, 0.05, 45, 0.05, 55, 0.05],	// blizzard
			64: [39, 0.02],						// frozen orb

			// assassin traps
			251: [256, 0.09, 261, 0.09, 262, 0.09, 271, 0.09, 272, 0.09, 276, 0.09],	// fireblast
			256: [261, 0.11, 271, 0.11, 276, 0.11],	// shock web
			261: [251, 0.06, 271, 0.06, 276, 0.06],	// charged bolt sentry
			262: [251, 0.08, 272, 0.08],	// wake of fire sentry
			271: [256, 0.12, 261, 0.12, 276, 0.12],	// lightning sentry
			272: [251, 0.10, 276, 0.10, 262, 0.07],	// inferno sentry
			276: [271, 0.12],	// death sentry

			// necro bone spells
			67: [78, 0.15, 84, 0.15, 88, 0.15, 93, 0.15],	// teeth
			73: [83, 0.20, 92, 0.20],	// poison dagger
			83: [73, 0.15, 92, 0.15], // poison explosion
			84: [67, 0.07, 78, 0.07, 88, 0.07, 93, 0.07], // bone spear
			92: [73, 0.10, 83, 0.10], // poison nova
			93: [67, 0.06, 78, 0.06, 84, 0.06, 88, 0.06], // bone spirit

			// barb war cry
			154: [130, 0.06, 137, 0.06, 146, 0.06], // war cry

			// paladin combat spells
			101: [112, 0.50, 121, 0.50], // holy bolt
			112: [108, 0.14, 115, 0.14], // blessed hammer
			121: [118, 0.07], // fist of heavens

			// paladin auras
			102: [100, 0.18, 125, 0.06],	// holy fire
			114: [105, 0.15, 125, 0.07],	// holy freeze
			118: [110, 0.12, 125, 0.04],	// holy shock

			// durid elemental skills
			225: [229, 0.23, 234, 0.23],	// firestorm
			229: [244, 0.10, 225, 0.08],	// molten boulder
			234: [225, 0.12, 244, 0.12],	// fissure (eruption)
			244: [229, 0.12, 234, 0.12, 249, 0.12],	// volcano
			249: [225, 0.14, 229, 0.14, 244, 0.14],	// armageddon
			230: [250, 0.15, 235, 0.15],	// arctic blast
			240: [245, 0.10, 250, 0.10],	// twister
			245: [235, 0.09, 240, 0.09, 250, 0.09],	// tornado
			250: [240, 0.09, 245, 0.09],	// hurricane

			// durid feral skills
			238: [222, 0.18],	// rabies
			239: [225, 0.22, 229, 0.22, 234, 0.22, 244, 0.22],	// fire claws

			// amazon bow/xbow skills
			11: [21, 0.12], // cold arrow
			21: [11, 0.08],	// ice arrow
			31: [11, 0.12],	// freezing arrow
			7: [16, 0.12],	// fire arrow
			16: [7, 0.12],	// exploding arrow
			27: [16, 0.10],	// immolation arrow

			// amazon spear/javalin skills
			14: [20, 0.10, 24, 0.10, 34, 0.10, 35, 0.10],	// power strike
			20: [14, 0.03, 24, 0.03, 34, 0.03, 35, 0.03], // lightning bolt
			24: [14, 0.10, 20, 0.10, 34, 0.10, 35, 0.10],	// charged strike
			34: [14, 0.08, 20, 0.08, 24, 0.10, 35, 0.10],	// lightning strike
			35: [14, 0.01, 20, 0.01, 24, 0.01, 34, 0.01],	// lightning fury
			15: [25, 0.12],	// poison javalin
			25: [15, 0.10],	// plague javalin
		},
		noMinSynergy: [14, 20, 24, 34, 35, 49, 53, 118, 256, 261, 271, 276],
		skillMult: {
			15: 25,
			25: 25,
			41: 25,
			46: 75,
			51: 75,
			73: 25,
			83: 25,
			92: 25,
			222: 25,
			225: 75,
			230: 25,
			238: 25,
			272: 25 / 3
		},
		baseSkillDamage: function (skillID) { // TODO: rework skill damage to use both damage fields
			let l = this.skillLevel(skillID), m = this.skillMult[skillID] || 1;
			let dmgFields = [['MinDam', 'MinLevDam1', 'MinLevDam2', 'MinLevDam3', 'MinLevDam4', 'MinLevDam5', 'MaxDam', 'MaxLevDam1', 'MaxLevDam2', 'MaxLevDam3', 'MaxLevDam4', 'MaxLevDam5'], ['EMin', 'EMinLev1', 'EMinLev2', 'EMinLev3', 'EMinLev4', 'EMinLev5', 'EMax', 'EMaxLev1', 'EMaxLev2', 'EMaxLev3', 'EMaxLev4', 'EMaxLev5']];

			if (skillID === 70) {
				return {
					type: "Physical",
					pmin: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]), getBaseStat('skills', skillID, dmgFields[1][1]), getBaseStat('skills', skillID, dmgFields[1][2]), getBaseStat('skills', skillID, dmgFields[1][3]), getBaseStat('skills', skillID, dmgFields[1][4]), getBaseStat('skills', skillID, dmgFields[1][5]), getBaseStat('skills', skillID, 'HitShift'), m),
					pmax: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]), getBaseStat('skills', skillID, dmgFields[1][1]), getBaseStat('skills', skillID, dmgFields[1][2]), getBaseStat('skills', skillID, dmgFields[1][3]), getBaseStat('skills', skillID, dmgFields[1][4]), getBaseStat('skills', skillID, dmgFields[1][5]), getBaseStat('skills', skillID, 'HitShift'), m),
					min: 0, max: 0
				};
			} else {
				let type = getBaseStat('skills', skillID, 'EType');

				return {
					type: this.damageTypes[type],
					pmin: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[0][0]), getBaseStat('skills', skillID, dmgFields[0][1]), getBaseStat('skills', skillID, dmgFields[0][2]), getBaseStat('skills', skillID, dmgFields[0][3]), getBaseStat('skills', skillID, dmgFields[0][4]), getBaseStat('skills', skillID, dmgFields[0][5]), getBaseStat('skills', skillID, 'HitShift'), m),
					pmax: this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[0][6]), getBaseStat('skills', skillID, dmgFields[0][7]), getBaseStat('skills', skillID, dmgFields[0][8]), getBaseStat('skills', skillID, dmgFields[0][9]), getBaseStat('skills', skillID, dmgFields[0][10]), getBaseStat('skills', skillID, dmgFields[0][11]), getBaseStat('skills', skillID, 'HitShift'), m),
					min: type ? this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][0]), getBaseStat('skills', skillID, dmgFields[1][1]), getBaseStat('skills', skillID, dmgFields[1][2]), getBaseStat('skills', skillID, dmgFields[1][3]), getBaseStat('skills', skillID, dmgFields[1][4]), getBaseStat('skills', skillID, dmgFields[1][5]), getBaseStat('skills', skillID, 'HitShift'), m) : 0,
					max: type ? this.stagedDamage(l, getBaseStat('skills', skillID, dmgFields[1][6]), getBaseStat('skills', skillID, dmgFields[1][7]), getBaseStat('skills', skillID, dmgFields[1][8]), getBaseStat('skills', skillID, dmgFields[1][9]), getBaseStat('skills', skillID, dmgFields[1][10]), getBaseStat('skills', skillID, dmgFields[1][11]), getBaseStat('skills', skillID, 'HitShift'), m) : 0
				};
			}
		},
		skillRadius: {
			//47: 8,
			//48: 5, // Nova
			55: 3,
			56: 12,
			92: 24,
			154: 12,
			249: 24,
			250: 24,
			251: 3,
		},
		novaLike: {
			44: true,
			48: true,
			92: true,
			112: true,
			154: true,
			249: true,
			250: true,
		},
		wolfBanned: {
			225: true,
			229: true,
			230: true,
			233: true,
			234: true,
			235: true,
			240: true,
			243: true,
			244: true,
			245: true,
			250: true,
		},
		bearBanned: {
			225: true,
			229: true,
			230: true,
			232: true,
			234: true,
			235: true,
			238: true,
			240: true,
			244: true,
			245: true,
			248: true,
		},
		humanBanned: {
			232: true,
			233: true,
			238: true,
			239: true,
			242: true,
			243: true,
			248: true,
		},
		nonDamage: {
			// Some fakes to avoid these

			54: true, // teleport
			217: true, // scroll identify
			218: true, // portal scroll
			219: true, // I assume this is the book of scroll
			220: true, // book portal. Not really a skill you want to use, do you
			117: true, // Holy shield. Holy shield it self doesnt give damage
			278: true, // venom adds damage, but doesnt do damage on its own

			// Remove all the trap skills, as we prefer to calculate this upon demand
			261: true, // lighting bolt
			271: true, // lighting sentry
			276: true, // Death sentry only works on corpses, we calculate this within attack
			262: true, // wake of fire
			272: true, // inferno
		},
		shiftState: function () {
			if (GameData.myReference.getState(139)) {
				return "wolf";
			}

			if (GameData.myReference.getState(140)) {
				return "bear";
			}

			return "human";
		},
		bestForm: function (skillID) {
			if (this.shiftState() === "human" && this.humanBanned[skillID]) {
				let highest = {ID: 0, Level: 0};

				if (!this.wolfBanned[skillID] && this.skillLevel(223) > highest.Level) {
					highest.ID = 223;
					highest.Level = this.skillLevel(223);
				}

				if (!this.bearBanned[skillID] && this.skillLevel(228) > highest.Level) {
					highest.ID = 228;
					highest.Level = this.skillLevel(228);
				}

				return highest.ID;
			} else if (this.shiftState() === "wolf" && this.wolfBanned[skillID]) {
				return 223;
			} else if (this.shiftState() === "bear" && this.bearBanned[skillID]) {
				return 228;
			}

			return 0;
		},
		dmgModifier: function (skillID, target) {
			let aps = (typeof target === 'number' ? this.averagePackSize(target) : 1),
				eliteBonus = (target.spectype && target.spectype & 0x7) ? 1 : 0, hitcap = 1;

			switch (skillID) { // charged bolt/strike excluded, it's so unreliably random
				case 15: // poison javalin
				case 25: // plague javalin
				case 16: // exploding arrow
				case 27: // immolation arrow
				case 31: // freezing arrow
				case 35: // lightning fury
				case 44: // frost nova
				case 48: // nova
				case 56: // meteor
				case 59: // blizzard
				case 64: // frozen orb
				case 83: // poison explosion
				case 92: // poison nova
				case 112: // blessed hammer
				case 154: // war cry
				case 229: // molten boulder
				case 234: // fissure
				case 249: // armageddon
				case 244: // volcano
				case 250: // hurricane
				case 251: // fireblast
				case 261: // charged bolt sentry
				case 262: // wake of fire
				case 55: // glacial spike
				case 47: // fire ball
				case 42: // Static field.
					hitcap = Infinity;
					break;
				case 34: // lightning strike
					hitcap = 1 + this.skillLevel(34);
					break;
				case 38: // charged bolt
					hitcap = 2 + this.skillLevel(38);
					break;
				case 67: // teeth
					hitcap = 1 + this.skillLevel(67);
					break;
				case 53: // chain lightning
					hitcap = 5 + ((this.skillLevel(53) / 5) | 0);
					break;
				case 24:
					hitcap = 3 + ((this.skillLevel(24) / 5) | 0);
					break;
				case 49: // lightning
				case 84: // bone spear
				case 271: // lightning sentry
				case 276: // death sentry
					hitcap = aps ? Math.sqrt(aps / Math.PI) * 2 : 1;
					break;
				default:
					hitcap = 1;
					break;
			}

			if (typeof target !== 'number') {
				let unit = getUnit(1);
				let radius = this.skillRadius[skillID] || 18;

				if (unit) {
					do {
						if (aps >= hitcap) {
							break;
						}

						if (target.gid !== unit.gid && getDistance(unit, this.novaLike[skillID] ? GameData.myReference : target) <= radius && isEnemy(unit)) {
							aps++;

							if (unit.spectype & 0x7) {
								eliteBonus++;
							}
						}
					} while (unit.getNext());
				}
			} else {
				aps = Math.min(aps, hitcap);
			}

			aps += eliteBonus * (4 - me.diff) / 2;

			return aps;
		},
		skillDamage: function (skillID, unit) {
			if (skillID === 0) {
				return {type: "Physical", pmin: 2, pmax: 8, min: 0, max: 0}; // short sword, no reqs
			}

			if (this.skillLevel(skillID) < 1) {
				return {
					type: this.damageTypes[getBaseStat('skills', skillID, 'EType')],
					pmin: 0,
					pmax: 0,
					min: 0,
					max: 0
				};
			}

			let dmg = this.baseSkillDamage(skillID), mastery = 1, psynergy = 1, synergy = 1, shots = 1, sl = 0;

			if (this.synergyCalc[skillID]) {
				let sc = this.synergyCalc[skillID];

				for (let c = 0; c < sc.length; c += 2) {
					sl = this.baseLevel(sc[c]);

					if (skillID === 229 || skillID === 244) {
						if (sc[c] === 229 || sc[c] === 244) { // molten boulder and volcano
							psynergy += sl * sc[c + 1]; // they only synergize physical with each other
						} else {
							synergy += sl * sc[c + 1]; // all other skills synergize only fire with these skills
						}
					} else {
						psynergy += sl * sc[c + 1];
						synergy += sl * sc[c + 1];
					}
				}
			}

			if (skillID === 227 || skillID === 237 || skillID === 247) {
				sl = this.skillLevel(247);
				psynergy += 0.15 + sl * 0.10;
				synergy += 0.15 + sl * 0.10;
			}

			switch (dmg.type) {
				case "Fire": // fire mastery
					mastery = 1 + GameData.myReference.getStat(329) / 100;
					dmg.min *= mastery;
					dmg.max *= mastery;
					break;
				case "Lightning": // lightning mastery
					mastery = 1 + GameData.myReference.getStat(330) / 100;
					dmg.min *= mastery;
					dmg.max *= mastery;
					break;
				case "Cold": // cold mastery
					mastery = 1 + GameData.myReference.getStat(331) / 100;
					dmg.min *= mastery;
					dmg.max *= mastery;
					break;
				case "Poison": // poison mastery
					mastery = 1 + GameData.myReference.getStat(332) / 100;
					dmg.min *= mastery;
					dmg.max *= mastery;
					break;
				case "Magic": // magic mastery
					mastery = 1 + GameData.myReference.getStat(357) / 100;
					dmg.min *= mastery;
					dmg.max *= mastery;
					break;
			}

			dmg.pmin *= psynergy;
			dmg.pmax *= psynergy;

			if (this.noMinSynergy.indexOf(skillID) < 0) {
				dmg.min *= synergy;
			}

			dmg.max *= synergy;

			switch (skillID) {
				case 102: // holy fire
					dmg.min *= 6; // weapon damage is 6x the aura damage
					dmg.max *= 6;
					break;
				case 114: // holy freeze
					dmg.min *= 5; // weapon damage is 5x the aura damage
					dmg.max *= 5;
					break;
				case 118: // holy shock
					dmg.min *= 6; // weapon damage is 6x the aura damage
					dmg.max *= 6;
					break;
				case 249: // armageddon
					dmg.pmin = dmg.pmax = 0;
					break;
				case 24: // charged strike
					dmg.max *= 3 + ((this.skillLevel(24) / 5) | 0);
			}

			dmg.pmin >>= 8;
			dmg.pmax >>= 8;
			dmg.min >>= 8;
			dmg.max >>= 8;

			switch (skillID) {
				case 59: // blizzard - on average hits twice
					dmg.min *= 2;
					dmg.max *= 2;
					break;
				case 62: // hydra - 3 heads
					dmg.min *= 3;
					dmg.max *= 3;
					break;
				case 64: // frozen orb - on average hits ~5 times
					dmg.min *= 5;
					dmg.max *= 5;
					break;
				case 70: // skeleton - a hit per skeleton
					sl = this.skillLevel(70);
					shots = sl < 4 ? sl : (2 + sl / 3) | 0;
					sl = Math.max(0, sl - 3);
					dmg.pmin = shots * (dmg.pmin + 1 + this.skillLevel(69) * 2) * (1 + sl * 0.07);
					dmg.pmax = shots * (dmg.pmax + 2 + this.skillLevel(69) * 2) * (1 + sl * 0.07);
					break;
				case 94: // fire golem
					sl = this.skillLevel(94);
					dmg.min = [10, 15, 18][me.diff] + dmg.min + (this.stagedDamage(sl + 7, 2, 1, 2, 3, 5, 7) >> 1) * 6; // basically holy fire added
					dmg.max = [27, 39, 47][me.diff] + dmg.max + (this.stagedDamage(sl + 7, 6, 1, 2, 3, 5, 7) >> 1) * 6;
					break;
				case 101: // holy bolt
					dmg.undeadOnly = true;
					break;
				case 112: // blessed hammer
					sl = this.skillLevel(113);

					if (sl > 0) {
						mastery = (100 + ((45 + this.skillLevel(113) * 15) >> 1)) / 100;	// hammer gets half concentration dmg bonus
						dmg.min *= mastery;
						dmg.max *= mastery;
					}

					break;
				case 221: // raven - a hit per raven
					shots = Math.min(5, this.skillLevel(221)); // 1-5 ravens
					dmg.pmin *= shots;
					dmg.pmax *= shots;
					break;
				case 227: // spirit wolf - a hit per wolf
					shots = Math.min(5, this.skillLevel(227));
					dmg.pmin *= shots;
					dmg.pmax *= shots;
					break;
				case 237: // dire wolf - a hit per wolf
					shots = Math.min(3, this.skillLevel(237));
					dmg.pmin *= shots;
					dmg.pmax *= shots;
					break;
				case 240: // twister
					dmg.pmin *= 3;
					dmg.pmax *= 3;
					break;
				case 261: // charged bolt sentry
				case 262: // wake of fire
				case 271: // lightning sentry
				case 272: // inferno sentry
				case 276: // death sentry
					dmg.min *= 5;	// can have 5 traps out at a time
					dmg.max *= 5;
					break;

				case sdk.skills.StaticField:
					if (!(unit instanceof Unit)) {
						break;
					}
					let staticCap = [0, 33, 50][me.diff];
					const [monsterId, areaId] = [unit.classid, unit.area],
						percentLeft = (unit.hp * 100 / unit.hpmax);
					if (staticCap > percentLeft) {
						break;
					}

					const maxReal = this.monsterMaxHP(monsterId, areaId, unit.charlvl - this.monsterLevel(monsterId, areaId)),
						hpReal = maxReal / 100 * percentLeft,
						potencialDmg = (hpReal / 100 * percentLeft) * .25;

					let tmpDmg = (maxReal / 100 * percentLeft) * (0.25);

					// We do need to calculate the extra damage, or less damage due to resistance
					let resist = this.monsterResist(unit, 'Lightning');
					let pierce = GameData.myReference.getStat(this.pierceMap['Lightning']);

					let conviction = this.getConviction();
					// if (conviction && !unit.getState(sdk.states.Conviction)) conviction = 0; //ToDo; enable when fixed telestomp
					resist -= (resist >= 100 ? conviction / 5 : conviction);

					if (resist < 100) {
						resist = Math.max(-100, resist - pierce);
					} else {
						resist = 100;
					}
					tmpDmg = potencialDmg * ((100 - resist) / 100);
					const percentageDamage = 100 / maxReal * tmpDmg;

					let avgDmg = tmpDmg;
					let overCap = percentLeft - staticCap - percentageDamage;
					if (overCap < 0) {
						let maxDmgPercentage = percentageDamage - Math.abs(overCap);
						avgDmg = maxReal / 100 * maxDmgPercentage;
					}
					avgDmg = avgDmg > 0 && avgDmg || 0;
					//print('Static will chop off -> ' + (100 / maxReal * avgDmg) + '%');
					dmg.min = avgDmg;
					dmg.max = avgDmg;
					break;
			}

			dmg.pmin |= 0;
			dmg.pmax |= 0;
			dmg.min |= 0;
			dmg.max |= 0;

			return dmg;
		},
		allSkillDamage: function (unit) {
			let skills = {};
			let self = this;
			GameData.myReference.getSkill(4).forEach(function (skill) {
				if (self.nonDamage.hasOwnProperty(skill[0])) {
					return false; // Doesnt do damage
				}
				return skills[skill[0]] = self.skillDamage(skill[0], unit);
			});

			return skills;
		},
		convictionEligible: {
			Fire: true,
			Lightning: true,
			Cold: true,
		},
		lowerResistEligible: {
			Fire: true,
			Lightning: true,
			Cold: true,
			Poison: true,
		},
		resistMap: {
			Physical: 36,
			Fire: 39,
			Lightning: 41,
			Cold: 43,
			Poison: 45,
			Magic: 37,
		},
		masteryMap: {
			Fire: 329,
			Lightning: 330,
			Cold: 331,
			Poison: 332,
			Magic: 357,
		},
		pierceMap: {
			Fire: 333,
			Lightning: 334,
			Cold: 335,
			Poison: 336,
			Magic: 358,
		},
		ignoreSkill: {
			40: true,
			50: true,
			60: true,
		},
		buffs: {
			8: 1,
			9: 1,
			13: 1,
			17: 1,
			18: 1,
			23: 1,
			28: 1,
			29: 1,
			32: 1,
			37: 1,
			40: 2,
			46: 1,
			50: 2,
			52: 1,
			57: 1,
			58: 1,
			60: 2,
			61: 1,
			63: 1,
			65: 1,
			68: 1,
			69: 1,
			79: 1,
			89: 1,
			98: 3,
			99: 3,
			100: 3,
			102: 3,
			103: 3,
			104: 3,
			105: 3,
			108: 3,
			109: 3,
			110: 3,
			113: 3,
			114: 3,
			115: 3,
			118: 3,
			119: 3,
			120: 3,
			122: 3,
			123: 3,
			124: 3,
			125: 3,
			127: 1,
			128: 1,
			129: 1,
			134: 1,
			135: 1,
			136: 1,
			138: 1,
			141: 1,
			145: 1,
			148: 1,
			149: 1,
			153: 1,
			155: 1,
			221: 1,
			222: 4,
			223: 5,
			224: 1,
			226: 6,
			227: 7,
			228: 5,
			231: 4,
			235: 1,
			236: 6,
			237: 7,
			241: 4,
			246: 6,
			247: 7,
			249: 1,
			250: 1,
			258: 8,
			267: 8,
			268: 9,
			279: 9,
		},
		preAttackable: [
			sdk.skills.MagicArrow, sdk.skills.FireArrow, sdk.skills.MultipleShot, sdk.skills.ExplodingArrow, sdk.skills.IceArrow, sdk.skills.GuidedArrow, sdk.skills.ImmolationArrow, sdk.skills.Strafe,
			sdk.skills.PlagueJavelin, sdk.skills.LightningFury,

			sdk.skills.FireBolt, sdk.skills.Inferno, sdk.skills.Blaze, sdk.skills.FireBall, sdk.skills.FireWall, sdk.skills.Meteor, sdk.skills.Hydra,

			sdk.skills.ChargedBolt, sdk.skills.Nova, sdk.skills.Lightning, sdk.skills.ChainLightning,

			sdk.skills.IceBolt, sdk.skills.FrostNova, sdk.skills.IceBlast, sdk.skills.Blizzard, sdk.skills.FrozenOrb,

			sdk.skills.AmplifyDamage, sdk.skills.DimVision, sdk.skills.Weaken, sdk.skills.IronMaiden, sdk.skills.Terror, sdk.skills.Confuse, sdk.skills.LifeTap, sdk.skills.Attract, sdk.skills.Decrepify, sdk.skills.LowerResist,

			sdk.skills.Teeth, sdk.skills.BoneSpear, sdk.skills.PoisonNova,

			sdk.skills.BlessedHammer,

			sdk.skills.WarCry,

			sdk.skills.Twister, sdk.skills.Tornado,

			sdk.skills.FireBlast, sdk.skills.ShockWeb,

		],
		monsterResist: function (unit, type) {
			let stat = this.resistMap[type];

			return stat ? (unit.getStat ? unit.getStat(stat) : MonsterData[unit][type]) : 0;
		},
		getConviction: function () {
			let merc = GameData.myReference.getMerc(), sl = this.skillLevel(123); // conviction
			if (( // Either me, or merc is wearing a conviction
				merc && merc.getItemsEx().filter(item => item.getPrefix(sdk.locale.items.Infinity)).first()
				|| GameData.myReference.getItemsEx().filter(item => item.getPrefix(sdk.locale.items.Infinity)).first())) {
				sl = 12;
			}
			return sl > 0 ? Math.min(150, 30 + (sl - 1) * 5) : 0;
		},
		getAmp: function () {
			return this.skillLevel(66) ? 100 : (this.skillLevel(87) ? 50 : 0);
		},
		monsterEffort: function (unit, areaID, skillDamageInfo = undefined, parent = undefined, preattack = false, all = false) {
			let eret = {effort: Infinity, skill: -1, type: "Physical"};
			let useCooldown = (typeof unit === 'number' ? false : Boolean(me.getState(121))),
				hp = this.monsterMaxHP(typeof unit === 'number' ? unit : unit.classid, areaID);
			let conviction = this.getConviction(), ampDmg = this.getAmp(),
				isUndead = (typeof unit === 'number' ? MonsterData[unit].Undead : MonsterData[unit.classid].Undead);
			skillDamageInfo = skillDamageInfo || this.allSkillDamage(unit);
			const allData = [];
			// if (conviction && unit instanceof Unit && !unit.getState(sdk.states.Conviction)) conviction = 0; //ToDo; enable when fixed telestomp

			let buffDmg = [], buffDamageInfo = {}, newSkillDamageInfo = {};

			for (let sk in skillDamageInfo) {
				if (this.buffs[sk]) {
					if (typeof unit === 'number') {
						buffDmg[this.buffs[sk]] = 0;
						buffDamageInfo[sk] = skillDamageInfo[sk];
					}
				} else {
					newSkillDamageInfo[sk] = skillDamageInfo[sk];
				}
			}

			skillDamageInfo = newSkillDamageInfo;

			for (let sk in buffDamageInfo) {
				// static field has a fix'd ceiling, calculated already
				if ([sdk.skills.StaticField].indexOf(sk) !== -1) continue;

				let avgPDmg = (buffDamageInfo[sk].pmin + buffDamageInfo[sk].pmax) / 2;
				let avgDmg = (buffDamageInfo[sk].min + buffDamageInfo[sk].max) / 2;
				let tmpDmg = 0;

				if (avgPDmg > 0) {
					let presist = this.monsterResist(unit, "Physical");

					presist -= (presist >= 100 ? ampDmg / 5 : ampDmg);
					presist = Math.max(-100, Math.min(100, presist));
					tmpDmg += avgPDmg * (100 - presist) / 100;
				}

				if (avgDmg > 0 && (!isUndead || !buffDamageInfo[sk].undeadOnly) && sk !== sdk.skills.StaticField) {
					let resist = this.monsterResist(unit, buffDamageInfo[sk].type);
					let pierce = GameData.myReference.getStat(this.pierceMap[buffDamageInfo[sk].type]);

					if (this.convictionEligible[buffDamageInfo[sk].type]) {
						resist -= (resist >= 100 ? conviction / 5 : conviction);
					}

					if (resist < 100) {
						resist = Math.max(-100, resist - pierce);
					} else {
						resist = 100;
					}

					tmpDmg += avgDmg * (100 - resist) / 100;
				}

				if (this.buffs[sk] === 1) {
					buffDmg[this.buffs[sk]] += tmpDmg;
				} else {
					buffDmg[this.buffs[sk]] = Math.max(buffDmg[this.buffs[sk]], tmpDmg);
				}
			}

			buffDmg = buffDmg.reduce((t, v) => t + v, 0);

			for (let sk in skillDamageInfo) {
				if (preattack && this.preAttackable.indexOf(parseInt(sk)) === -1) continue; // cant preattack this skill
				if (!this.ignoreSkill[sk] && (!useCooldown || !this.skillCooldown(sk | 0))) {
					let avgPDmg = (skillDamageInfo[sk].pmin + skillDamageInfo[sk].pmax) / 2, totalDmg = buffDmg;
					let avgDmg = (skillDamageInfo[sk].min + skillDamageInfo[sk].max) / 2;

					if (avgPDmg > 0 && sk !== sdk.skills.StaticField) {
						let presist = this.monsterResist(unit, "Physical");

						presist -= (presist >= 100 ? ampDmg / 5 : ampDmg);
						presist = Math.max(-100, Math.min(100, presist));
						totalDmg += avgPDmg * (100 - presist) / 100;
					}

					if (avgDmg > 0 && (!isUndead || !skillDamageInfo[sk].undeadOnly)) {
						let resist = this.monsterResist(unit, skillDamageInfo[sk].type);
						let pierce = GameData.myReference.getStat(this.pierceMap[skillDamageInfo[sk].type]);

						if (this.convictionEligible[skillDamageInfo[sk].type]) {
							resist -= (resist >= 100 ? conviction / 5 : conviction);
						}

						if (resist < 100) {
							resist = Math.max(-100, resist - pierce);
						} else {
							resist = 100;
						}

						totalDmg += sk !== sdk.skills.StaticField
							&& 0
							|| avgDmg * (100 - resist) / 100;


					}

					let tmpEffort = Math.ceil(hp / totalDmg);

					tmpEffort /= this.dmgModifier(sk | 0, parent || unit);

					// care for mana
					if (GameData.myReference.mp < Skills.manaCost[sk]) {
						tmpEffort *= 5; // More effort in a skill we dont have mana for
					}

					// Use less cool down spells, if something better is around
					if (this.skillCooldown(sk | 0)) {
						tmpEffort *= 5;
					}
					if (tmpEffort <= eret.effort) {
						eret.effort = tmpEffort;
						eret.skill = sk | 0;
						eret.type = skillDamageInfo[eret.skill].type;
						eret.name = getSkillById(eret.skill);
						if (all) {
							allData.unshift(Misc.copy(eret));
						}
					}
				}
			}
			if (all && allData.length) {
				return allData;
			}
			if (eret.skill >= 0) {
				return eret;
			}
			return null;
		},
		areaEffort: function (areaID, skills) {
			let effortpool = 0, raritypool = 0;
			skills = skills || this.allSkillDamage();

			AreaData[areaID].forEachMonsterAndMinion((mon, rarity, parent) => {
				effortpool += rarity * this.monsterEffort(mon.Index, areaID, skills, parent && parent.Index).effort;
				raritypool += rarity;
			});

			return raritypool ? effortpool / raritypool : Infinity;
		},
		areaSoloExp: function (areaID, skills) {
			let effortpool = 0, raritypool = 0;
			skills = skills || this.allSkillDamage();
			AreaData[areaID].forEachMonsterAndMinion((mon, rarity, parent) => {
				effortpool += rarity * this.monsterExp(mon.Index, areaID) * this.levelModifier(GameData.myReference.charlvl, this.monsterLevel(mon.Index, areaID)) / this.monsterEffort(mon.Index, areaID, skills, parent && parent.Index).effort;
				raritypool += rarity;
			});

			return raritypool ? effortpool / raritypool : 0;
		},
		mostUsedSkills: function (force = false) {
			if (!force && GameData.myReference.hasOwnProperty('__cachedMostUsedSkills') && GameData.myReference.__cachedMostUsedSkills) return GameData.myReference.__cachedMostUsedSkills;

			const effort = [], uniqueSkills = [];
			for (let i = 50; i < 120; i++) {
				try {
					effort.push(GameData.monsterEffort(i, sdk.areas.ThroneOfDestruction))
				} catch (e) {/*dontcare*/
				}
			}

			effort
				.filter(e => e !== null && typeof e === 'object' && e.hasOwnProperty('skill'))
				.filter(x => GameData.myReference.getSkill(x.skill, 0)) // Only skills where we have hard points in
				.filter(x => Skills.class[x.skill] < 7) // Needs to be a skill of a class, not my class but a class
				.map(x =>
					// Search for this unique skill
					(
						uniqueSkills.find(u => u.skillId === x.skill)
						// Or add it and return the value
						|| (
							(
								uniqueSkills.push({skillId: x.skill, used: 0})
								&& false
							)
							|| uniqueSkills[uniqueSkills.length - 1]
						)
					).used++ && false
					// In the end always return x
					|| x
				);


			return (GameData.myReference.__cachedMostUsedSkills = uniqueSkills.sort((a, b) => b.used - a.used));
		},
		myReference: me,

		// returns the amount of life or mana (as absolute value, not percent) a potion gives
		potionEffect: function (potionClassId, charClass = GameData.myReference.classid) {
			let potion = Potions[potionClassId];
			if (!potion) {
				return 0;
			}
			let effect = potion.effect[charClass] || 0;
			if (!effect) {
				return 0;
			}
			return [515, 516].indexOf(potionClassId) > -1 ? GameData.myReference.hpmax / effect * 100 : effect;
		},

		// returns the amount of life or mana (as absolute value, not percent) a potion gives
		potionEffectPerSecond: function (potionClassId, charClass = GameData.myReference.classid) {
			let effect = this.potionEffect(potionClassId, charClass);
			let potion = Potions[potionClassId];
			if (!potion) {
				return 0;
			}
			let duration = potion.duration;
			if (duration) {
				return effect / duration;
			}
			return 0;
		},

		// Returns the number of frames needed to cast a given skill at a given FCR for a given char.
		castingFrames: function (skillId, fcr = GameData.myReference.getStat(105), charClass = GameData.myReference.classid) {
			// https://diablo.fandom.com/wiki/Faster_Cast_Rate
			let effectiveFCR = Math.min(75, (fcr * 120 / (fcr + 120)) | 0);
			let isLightning = skillId === sdk.skills.Lightning || skillId === sdk.skills.ChainLightning;
			let baseCastRate = [20, isLightning ? 19 : 14, 16, 16, 14, 15, 17][charClass];
			if (isLightning) {
				return Math.round(256 * baseCastRate / (256 * (100 + effectiveFCR) / 100));
			}

			let animationSpeed = {
				normal: 256,
				human: 208,
				wolf: 229,
				bear: 228
			}[charClass === sdk.charclass.Druid ? this.shiftState() : "normal"];
			return Math.ceil(256 * baseCastRate / Math.floor(animationSpeed * (100 + effectiveFCR) / 100)) - 1;
		},

		// Returns the duration in seconds needed to cast a given skill at a given FCR for a given char.
		castingDuration: function (skillId, fcr = GameData.myReference.getStat(105), charClass = GameData.myReference.classid) {
			return this.castingFrames(skillId, fcr, charClass) / 25;
		}
	};

// Export data
	GameData.MissilesData = MissilesData;
	GameData.AreaData = AreaData;
	GameData.isEnemy = isEnemy;
	GameData.isAlive = isAlive;
	GameData.onGround = onGround;
	GameData.itemTier = itemTier;
	GameData.PresetMonsters = PresetMonsters;
	GameData.Potions = Potions;
	GameData.Quests = Quests;

	module.exports = GameData;
})(module, require);