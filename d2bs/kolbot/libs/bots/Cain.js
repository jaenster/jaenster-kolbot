/**
 * @author ryancrunchi
 * @description Cain quest, with scroll of inifuss and stones handling.
 */
(function (module,require) {
	const Cain = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable'),
			Quests = require('QuestEvents'),
			NPC = require('NPC');

		Quests.on(sdk.quests.TheSearchForCain, (state) => {
			print("Cain quest update");
			if (state[0]) { // quest done
				print("Cain quest done");
			}
			else if (!state[4]) { // need to open trist
				if (!me.getItem(524) && !me.getItem(525)) { // need Scroll of Inifuss / Key to the cairn stone
					print("Getting scroll");
					me.journeyToPreset(sdk.areas.DarkWood, sdk.unittype.Objects, sdk.units.InifussTree, 5, 5);		
					Attack.clear(25, 0, getLocaleString(sdk.locale.monsters.TreeheadWoodFist));
					me.getQuestItem(524, sdk.units.InifussTree);
				}
				/*if (me.getItem(524) && !me.getItem(525)) {
					me.talkTo(NPC.Akara);
				}*/
				else {
					print("Already have scroll");
				}

				// rakanishu
				me.journeyToPreset(sdk.areas.StonyField, sdk.unittype.Monsters, 737, 0, 0);
				Attack.clear(25, 0, getLocaleString(sdk.locale.monsters.Rakanishu));

				// go to cain stones and open trist
				var stones = [
					getUnit(2, sdk.units.StoneAlpha),
					getUnit(2, sdk.units.StoneBeta),
					getUnit(2, sdk.units.StoneGamma),
					getUnit(2, sdk.units.StoneDelta),
					getUnit(2, sdk.units.StoneLambda),
					getUnit(2, sdk.units.StoneTheta)
				];
				var promises = [];
				for (var i = 0; i < 5; i++) {
					for (var j = 0; j < stones.length; j++) {
						Misc.openChest(stones[j]) && Attack.clear(5);
					}
				}

				for (i = 0; i < 5; i += 1) {
					if (!Pather.usePortal(sdk.areas.Tristram)) {
						delay(1000);
					}
				}
				 // open cain jail
				Pather.moveTo(25175, 5160, 3, false);
				var jail = getUnit(sdk.unittype.Objects, sdk.units.CainsJail);
				if (jail) {
					for (i = 0; i < 5; i += 1) {
						if (getDistance(me, jail) > 3) {
							Pather.moveToUnit(jail);
						}
					}
					Misc.openChest(jail);
				}
			}
			if (state[1]) { // cain rescued, need to talk to him and akara
				me.talkTo(NPC.Cain);
				me.talkTo(NPC.Akara);
			}
		});
	}


	module.exports = Cain;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );



