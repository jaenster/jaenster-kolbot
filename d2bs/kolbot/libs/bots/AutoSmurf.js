/**
 * @author ryancrunchi
 * @description Smurfing smurf automatic smurf.
 */
(function (module,require) {


	const AutoSmurf = function (Config, Attack, Pickit, Pather, Town) {

		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Quests = require('QuestEvents'),
			NPC = require('NPC'),
			AutoSkill = require('AutoSkill'),
			AutoStat = require('AutoStat'),
			GameData = require('GameData'),
			AutoEquip = require('AutoEquip'),
			NTIP = require('NTIP'),
			Worker = require('Worker'),
			Delta = new (require('Deltas'));

		Worker.runInBackground.stamina = function () {
			if (typeof me === 'undefined' || me.dead) return true; // happens when we are dead

			if (me.stamina / me.staminamax <= 0.15) {
				let pot = me.getItemsEx(-1).filter(i => i.classid === 513 && i.location === sdk.storage.Belt || i.location === sdk.storage.Inventory).sort((a, b) => a.location - b.location).first();
				pot && pot.interact(); // interact with pot (aka click on it)
				delay(500);
			}
			return true;
		};

		Delta.track(() => me.area, () => me.area && revealLevel(true));
		
		AutoSkill.skills = { // Default stats
				// First the skills needed
				// [sdk.skills.Telekinesis, 1],
				// [sdk.skills.Teleport, 1],
				// [sdk.skills.FrozenArmor, 1],
				// [sdk.skills.Warmth, 1],
				// [sdk.skills.StaticField, 1],

				// [sdk.skills.FrostNova, 1], // <-- Frost nova is a pre needed skill
				// [sdk.skills.ColdMastery, 1], // <-- 1 skill before maxing the rest to be sure

				// [sdk.skills.Blizzard, 20],
				// [sdk.skills.IceBlast, 20],
				// [sdk.skills.GlacialSpike, 20],
				// [sdk.skills.IceBolt, 20],
				// [sdk.skills.ColdMastery, 20], // <-- max cold mastery to 20, last thing we do
		};

		AutoStat.stats = { // Default stats
			strength: [156, 1],
			dexterity: [0, 0],
			vitality: [400, 3], // Last but not least
			energy: [0, 0],
		};

		var AutoSmurfConfig = [
			// norm
			{

			},

			// nm
			{

			},

			// hell
			{

			}
		];

		me.on('lvlup', () => {
			print('LEVEL UP !');
			NTIP.ClearRuntime();
			updatePickit();
		});
		Delta.track(() => me.charlvl, () => me.emit('lvlup'));

		function updatePickit() {
			print("updatePickit");
			for (var potId in GameData.Potions) {
				var cost = GameData.Potions[potId].cost;
				if (cost == undefined || cost > me.gold) {
					NTIP.AddEntry("[name] == "+potId);
				}
			}

			if (me.staminaMaxDuration < 60) {
				NTIP.AddEntry("[name] == staminapotion # # [maxquantity] == 2");
			}

			if (me.lowGold) {
				NTIP.AddEntry("[name] == gold");
			}

			if (!me.findItem(sdk.items.tptome)) {
				NTIP.AddEntry("[name] == scrolloftownportal # # [maxquantity] == 2");
			}

			if (!me.findItem(sdk.items.idtome)) {
				NTIP.AddEntry("[name] == scrollofidentify # # [maxquantity] == 2");
			}
		};

		function whatToDo() {
			var easyAreas = GameData.AreaData.filter(area => GameData.areaEffort(area.Index) < 3);
			//print(easyAreas.length+" areas to farm");
			print("easyAreas : "+easyAreas.map(a => a.Index));

			var questsToDo = GameData.Quests
				.filter(q => !me.getQuest(q.index, 0) && (q.mandatory || q.reward))
				.map(q => {
					Object.assign(q, {score: GameData.Quests.questScore(q)});
					return q;
				})
				.sort((a, b) => b.score - a.score);
			print("questsToDo : "+questsToDo.map(q => q.index));

			var easyQuests = questsToDo
				.filter(q => q.areas.intersection(easyAreas.map(a => a.Index)).length > 0);
			print("easyQuests : "+easyQuests.map(q => q.index));

			easyQuests.forEach(q => {
				q.do();
				Town();
			});

			if (easyQuests.length == 0) {
				// do exp
				easyAreas.forEach(a => {
					Pather.journeyTo(a.Index, true);
					Attack.clearLevelWalk();
				});
			}
		};

		updatePickit();
		Town();
		whatToDo();

		//require("../bots/Den")(Config, Attack, Pickit, Pather, Town);
		//require("../bots/Cain")(Config, Attack, Pickit, Pather, Town);
		//require("../bots/Tombs")(Config, Attack, Pickit, Pather, Town);

		while (me.ingame) {
			delay(1000);
		}
	}


	module.exports = AutoSmurf;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );



/*

(function(module,require) {
    // Load all required files
    ['require.js', 'sdk.js'].forEach(include);

    if (getScript.startAsThread() === 'thread') {
        // We are a thread now, so we can load maphack here
        include('bots/maphack.js'); // ToDo; convert to module? =)
        // Config, Attack, Pickit, Pather, Town, Misc
		MapHack.apply(null, ['Config', 'Attack', 'Pickit', 'Pather', 'Town', 'Misc'].map(x => require(x)));
    }

})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);





*/



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
ÿc; 
*/