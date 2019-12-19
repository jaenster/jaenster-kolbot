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
			GameData = require('GameData'),
			AutoEquip = require('AutoEquip'),
			AutoConfig = require('AutoConfig'),
			NTIP = require('NTIP'),
			Worker = require('Worker'),
			Questing = require('../bots/Questing'),
			Delta = new (require('Deltas'));

		Worker.runInBackground.stamina = function () {
			if (typeof me === 'undefined' || me.dead) return true; // happens when we are dead

			const stamina = me.stamina / me.staminamax;

			switch (true) {
				case me.inTown && !me.runwalk:
					me.runwalk = 1;
					break;

				case !me.inTown && me.runwalk && stamina <= 0.15:
					let pot = me.getItemsEx()
						.filter(i => i.classid === sdk.items.StaminaPotion && (i.location === sdk.storage.Belt || i.location === sdk.storage.Inventory))
						.sort((a, b) => a.location - b.location)
						.first();
					if (pot) {
						pot.interact();
					}
					else {
						me.runwalk = 0;
					}
					break;

				case !me.inTown && !me.runwalk && stamina >= 0.9:
					me.runwalk = 1;
					break;

				default: break;
			}
			return true;
		};

		Delta.track(() => me.area, () => me.area && delay(80) && revealLevel(true));
		Delta.track(() => me.mode, () => me.mode == 17 && quit());

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
			AutoConfig.MiscPickit();
		});
		Delta.track(() => me.charlvl, () => me.emit('lvlup'));

		let works = [];

		function whatToDo() {
			var easyAreas = GameData.AreaData.filter(area => GameData.areaEffort(area.Index) <= 3);
			var expAreas = GameData.AreaData
				.filter(a => Pather.accessToAct(a.Act))
				.sort((a, b) => GameData.areaSoloExp(b.Index) - GameData.areaSoloExp(a.Index));
			//print(easyAreas.length+" areas to farm");
			//print("easyAreas : "+easyAreas.map(a => a.Index));

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
				Quests.on(q.index, state => {
					print(q.name);
					print(state);
				});
				Quests.emit(q.index, Quests.states[q.index]);
				works.push(q.do);
				works.push(Town);
			});

			if (!easyQuests.length) {
				// do exp
				expAreas.forEach(a => {
					print("Going to "+a.LocaleString+" to XP");
					Pather.journeyTo(a.Index, true);
					Pather.getWP(a.Index, true);
					Attack.clearLevel({spectype: 0, quitWhen: () => works.length});
					Town();
				});
			}
		};

		//updatePickit();
		Town();
		whatToDo();

		//require("../bots/Den")(Config, Attack, Pickit, Pather, Town);
		//require("../bots/Cain")(Config, Attack, Pickit, Pather, Town);
		//require("../bots/Tombs")(Config, Attack, Pickit, Pather, Town);

		while (me.ingame) {
			if (!works.length) {
				print("nothing to do, quit game ?");
				whatToDo();
			}
			else {
				try {
					works.shift()();
				}
				catch (e) {
					print(e);
					print(e.stack);
				}
			}
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