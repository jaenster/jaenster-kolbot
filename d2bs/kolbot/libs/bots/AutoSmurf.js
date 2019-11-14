/**
 * @author ryancrunchi
 * @description Smurfing smurf automatic smurf.
 */
(function (module,require) {
	const AutoSmurf3 = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Quests = require('QuestEvents'),
			NPC = require('NPC');


		/*
			SpokeToWarriv: 0,
			DenOfEvil: 1,
			SistersBurialGrounds: 2,
			TheSearchForCain: 4,
			ForgottenTower: 5,
			ToolsOfTheTrade: 3,
			SistersToTheSlaughter: 6,
			AbleToGotoActII: 7,
			SpokeToJerhyn: 8,
			RadamentsLair: 9,
			TheHoradricStaff: 10,
			TheTaintedSun: 11,
			TheArcaneSanctuary: 12,
			TheSummoner: 13,
			TheSevenTombs: 14,
			AbleToGotoActIII: 15,
			SpokeToHratli: 16,
			TheGoldenBird: 20,
			BladeOfTheOldReligion: 19,
			KhalimsWill: 18,
			LamEsensTome: 17,
			TheBlackenedTemple: 21,
			TheGuardian: 22,
			AbleToGotoActIV: 23,
			SpokeToTyrael: 24,
			TheFallenAngel: 25,
			HellsForge: 27,
			TerrorsEnd: 26,
			AbleToGotoActV: 28,
			SeigeonHaggorath: 35,
			RescueonMountArreat: 36,
			PrisonOfIce: 37,
			BetrayalOfHaggorath: 38,
			RiteOfPassage: 39,
			EveOfDestruction: 40,
			SecretCowLevel: 41,
		*/

		/*Quests.on(sdk.quests.DenOfEvil, (state) => {
			print("Den quest update");
			if (state[0]) { // quest done
				print("Den quest done");
			}
			else if (state[1]) { // all monsters killed, talk to akara
				if (me.inTown) {
					me.talkTo(NPC.Akara);
				}
				else {
					var tries = 0;
					while (!me.inTown && tries < 3) {
						Pather.journeyTo(sdk.areas.RogueEncampment, true);
						tries++;
					}
					me.talkTo(NPC.Akara);
				}
			}
			else {
				print("Doing Den quest");
				require("../bots/Den")(Config, Attack, Pickit, Pather, Town);
			}
		});*/
		//require("../bots/Den")(Config, Attack, Pickit, Pather, Town);
		//me.talkTo(NPC.Akara);


		/*
		ÿc0 white
		ÿc1 red
		ÿc2 green
		ÿc3 blue
		ÿc4 dark gold
		ÿc5 gray
		ÿc6 black
		ÿc7 gold
		ÿc8 orange
		ÿc9 yellow
		*/
		
		require("../bots/Cain")(Config, Attack, Pickit, Pather, Town);


		while (me.ingame) {
			delay(1000);
		}
	}


	module.exports = AutoSmurf3;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
