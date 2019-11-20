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
			Delta = new (require('Deltas'));
		/*
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
			for (var potId in GameData.Potions.hp) {
				var effect = GameData.potionEffect(potId) / me.hpmax * 100;
				if (effect >= Config.UseHP) {
					NTIP.AddEntry("[name] == "+potId);
				}
			}
			for (var potId in GameData.Potions.mp) {
				var effect = GameData.potionEffect(potId) / me.mpmax * 100;
				if (effect >= Config.UseMP) {
					NTIP.AddEntry("[name] == "+potId);
				}
			}

			if (me.staminaMaxDuration < 60) {
				NTIP.AddEntry("[name] == staminapotion");
			}

			if (me.gold < 500) {
				NTIP.AddEntry("[name] == gold");
			}
		};*/

		function whatToDo() {
			var easyAreas = GameData.AreaData.filter(area => GameData.areaEffort(area.Index) < 3);
			print(easyAreas.length+" areas to farm");
			print(easyAreas);

			var questAreas = GameData.Quests.filter(q => q.mandatory).map(q => q.areas).flat();

			/*
			easyAreas.forEach(a => {
				Pather.journeyTo(a.Index, true);
				Attack.clearLevelWalk();
			});*/
			Town();
		};

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





(function(module,require) {
    // Load all required files
    //['require.js', 'sdk.js'].forEach(include);

    if (getScript.startAsThread() === 'thread') {
        // We are a thread now, so we can load maphack here
        include('bots/maphack.js'); // ToDo; convert to module? =)
        // Config, Attack, Pickit, Pather, Town, Misc
		MapHack.apply(null, ['Config', 'Attack', 'Pickit', 'Pather', 'Town', 'Misc'].map(x => require(x)));
    }

})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);









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