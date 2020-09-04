(function (module, require) {
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

	Quests.logQuestStatuses = function (quest) {
		if (typeof quest !== 'object') quest = Quests[quest];

		print('------------------------');
		print('--- quest log - ' + quest.name);
		let text = this.fetchQuestArray(quest);
		print('0\xFFc5|\xFFc01\xFFc5|\xFFc02\xFFc5|\xFFc03\xFFc5|\xFFc04\xFFc5|\xFFc05\xFFc5|\xFFc06\xFFc5|\xFFc07\xFFc5|\xFFc08\xFFc5|\xFFc09\xFFc5|\xFFc0A\xFFc5|\xFFc0B');
		print(text.join('\xFFc5|\xFFc0'));
		print('------------------------');

	};
	Quests.fetchQuestArray = function (quest) {
		if (typeof quest !== 'object') quest = Quests[quest];

		let q = [];
		for (let i = 0; i < 12; ++i) {
			q.push(me.getQuest(quest.index, i));
		}
		return q;
	};

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
	};

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
	};

	const QuestConsts = {
		opensAreas: {

			// this makes the program more easy, you need to talk to warriv @ act 1. If you didnt, its a very new char so. Do this so it seems like area's open up
			SpokeToWarriv: [sdk.areas.RogueEncampment, sdk.areas.BloodMoor, sdk.areas.ColdPlains, sdk.areas.StonyField, sdk.areas.DarkWood, sdk.areas.BlackMarsh, sdk.areas.TamoeHighland, sdk.areas.DenOfEvil, sdk.areas.CaveLvl1, sdk.areas.UndergroundPassageLvl1, sdk.areas.HoleLvl1, sdk.areas.PitLvl1, sdk.areas.CaveLvl2, sdk.areas.UndergroundPassageLvl2, sdk.areas.HoleLvl2, sdk.areas.PitLvl2, sdk.areas.BurialGrounds, sdk.areas.Crypt, sdk.areas.Mausoleum, sdk.areas.ForgottenTower, sdk.areas.TowerCellarLvl1, sdk.areas.TowerCellarLvl2, sdk.areas.TowerCellarLvl3, sdk.areas.TowerCellarLvl4, sdk.areas.TowerCellarLvl5, sdk.areas.MonasteryGate, sdk.areas.OuterCloister, sdk.areas.Barracks, sdk.areas.JailLvl1, sdk.areas.JailLvl2, sdk.areas.JailLvl3, sdk.areas.InnerCloister, sdk.areas.Cadral, sdk.areas.CatacombsLvl1, sdk.areas.CatacombsLvl2, sdk.areas.CatacombsLvl3, sdk.areas.CatacombsLvl4],

			// Act 1 gives access to all areas, except tristham
			TheSearchForCain: [sdk.areas.Tristram],

			// act 2
			AbleToGotoActII: [sdk.areas.LutGholein, sdk.areas.RockyWaste, sdk.areas.DryHills, sdk.areas.FarOasis, sdk.areas.LostCity, sdk.areas.ValleyOfSnakes,

				// sewers are always available
				sdk.areas.A2SewersLvl1, sdk.areas.A2SewersLvl2, sdk.areas.A2SewersLvl3,

				// Dungeons are always available if you have access to act 2
				sdk.areas.StonyTombLvl1, sdk.areas.HallsOfDeadLvl1, sdk.areas.HallsOfDeadLvl2, sdk.areas.ClawViperTempleLvl1, sdk.areas.StonyTombLvl2, sdk.areas.HallsOfDeadLvl3, sdk.areas.ClawViperTempleLvl2, sdk.areas.MaggotLairLvl1, sdk.areas.MaggotLairLvl2, sdk.areas.MaggotLairLvl3, sdk.areas.AncientTunnels,
			],
			TheArcaneSanctuary: [sdk.areas.CanyonOfMagi, sdk.areas.TalRashasTomb1, sdk.areas.TalRashasTomb2, sdk.areas.TalRashasTomb3, sdk.areas.TalRashasTomb4, sdk.areas.TalRashasTomb5, sdk.areas.TalRashasTomb6, sdk.areas.TalRashasTomb7],

			TheTaintedSun: [sdk.areas.HaremLvl1, sdk.areas.HaremLvl2, sdk.areas.PalaceCellarLvl1, sdk.areas.PalaceCellarLvl2, sdk.areas.PalaceCellarLvl3, sdk.areas.ArcaneSanctuary],

			// Placing the staff completes the quest and its what opens it
			TheHoradricStaff: [sdk.areas.DurielsLair],


			// act 3
			// This opens everything @ act 3 except mephisto area's
			AbleToGotoActIII: [sdk.areas.KurastDocktown, sdk.areas.SpiderForest, sdk.areas.GreatMarsh, sdk.areas.FlayerJungle, sdk.areas.LowerKurast, sdk.areas.KurastBazaar, sdk.areas.UpperKurast, sdk.areas.KurastCauseway, sdk.areas.Travincal, sdk.areas.SpiderCave, sdk.areas.SpiderCavern, sdk.areas.SwampyPitLvl1, sdk.areas.SwampyPitLvl2, sdk.areas.FlayerDungeonLvl1, sdk.areas.FlayerDungeonLvl2, sdk.areas.SwampyPitLvl3, sdk.areas.FlayerDungeonLvl3, sdk.areas.A3SewersLvl1, sdk.areas.A3SewersLvl2, sdk.areas.RuinedTemple, sdk.areas.DisusedFane, sdk.areas.ForgottenReliquary, sdk.areas.ForgottenTemple, sdk.areas.RuinedFane, sdk.areas.DisusedReliquary,],
			KhalimsWill: [sdk.areas.DuranceOfHateLvl1, sdk.areas.DuranceOfHateLvl2, sdk.areas.DuranceOfHateLvl3],

			// act 4 is bloody simple
			AbleToGotoActIV: [sdk.areas.PandemoniumFortress, sdk.areas.OuterSteppes, sdk.areas.PlainsOfDespair, sdk.areas.CityOfDamned, sdk.areas.RiverOfFlame, sdk.areas.ChaosSanctuary],


			// Act 5
			// Act 5 is very much like act 3, you can enter almost all from the start, minor differences
			AbleToGotoActV: [
				sdk.areas.Harrogath,
				sdk.areas.BloodyFoothills,
				sdk.areas.FrigidHighlands,
				sdk.areas.ArreatPlateau,
				sdk.areas.CrystalizedPassage,
				sdk.areas.FrozenRiver,
				sdk.areas.GlacialTrail,
				sdk.areas.DrifterCavern,
				sdk.areas.FrozenTundra,
				sdk.areas.AncientsWay,
				sdk.areas.IcyCellar,
				sdk.areas.ArreatSummit,
				sdk.areas.Abaddon,
				sdk.areas.PitOfAcheron,
				sdk.areas.InfernalPit,
			],

			// Anya's quest opens up the temple areas
			PrisonOfIce: [sdk.areas.NihlathaksTemple, sdk.areas.HallsOfAnguish, sdk.areas.HallsOfPain, sdk.areas.HallsOfVaught,],

			// Ancients open up the throne obv
			RiteOfPassage: [sdk.areas.WorldstoneLvl1, sdk.areas.WorldstoneLvl2, sdk.areas.WorldstoneLvl3, sdk.areas.ThroneOfDestruction, sdk.areas.WorldstoneChamber,],

			// Technically so does Chaos but, lets focus on xpac. @ToDo: Fix classic support
			EveOfDestruction: [sdk.areas.MooMooFarm],
		},
		prerequisites: {
			// Act 1,
			// You can do everything right away @ act 1, however these 2 are special
			SecretCowLevel: [sdk.quests.TheSearchForCain, sdk.quests.EveOfDestruction], // side quest
			RespecQuest: [sdk.quests.DenOfEvil], // side quest / reward


			// Act 2

			// To go to act 2, you need to pwn andy
			AbleToGotoActII: [sdk.quests.SistersToTheSlaughter],
			RadamentsLair: [sdk.quests.AbleToGotoActII], // Side quest  / reward
			TheTaintedSun: [sdk.quests.AbleToGotoActII],
			TheArcaneSanctuary: [sdk.quests.TheTaintedSun],
			TheHoradricStaff: [sdk.quests.TheArcaneSanctuary],
			TheSevenTombs: [sdk.quests.TheHoradricStaff],

			// Act 3
			AbleToGotoActIII: [sdk.quests.TheSevenTombs],
			LamEsensTome: [sdk.quests.AbleToGotoActIII], // Side quest  / reward
			KhalimsWill: [sdk.quests.AbleToGotoActIII],
			TheBlackenedTemple: [sdk.quests.KhalimsWill],
			TheGuardian: [sdk.quests.KhalimsWill], // you can glitch around it but lets assume this

			// Act 4,
			AbleToGotoActIV: [sdk.quests.TheGuardian],
			HellsForge: [sdk.quests.AbleToGotoActIV], // Side quest / reward
			TheFallenAngel: [sdk.quests.AbleToGotoActIV], // Side quest / reward
			TerrorsEnd: [sdk.quests.AbleToGotoActIV],

			// Act 5,
			AbleToGotoActV: [sdk.quests.TerrorsEnd],
			SiegeOnHarrogath: [sdk.quests.AbleToGotoActV], // Side quest / reward
			PrisonOfIce: [sdk.quests.AbleToGotoActV],// Side quest / reward
			RiteOfPassage: [sdk.quests.AbleToGotoActV], // lvl req
			EveOfDestruction: [sdk.quests.RiteOfPassage],
		}
	};
	for (var q = sdk.quests.SpokeToWarriv; q <= sdk.quests.SecretCowLevel; q++) {
		Quests[q] = {
			index: q,
			name: Object.keys(sdk.quests).find(x => sdk.quests[x] === q),
			mandatory: MandatoryQuests.indexOf(q) > -1,
			reward: RewardedQuests.indexOf(q) > -1,
			areas: Quests.areasForQuest(q),
			bosses: Quests.bossForQuest(q),
			opensAreas: [], // Set in block below
			prerequisites: [], // Set in block below
		};
		['opensAreas', 'prerequisites'].forEach(key => Quests[q][key] = QuestConsts[key].hasOwnProperty(Quests[q].name) ? QuestConsts[key][Quests[q].name] : []);
	}

//(Quests);

	module.exports = Quests;
})(module, require);