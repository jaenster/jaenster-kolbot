/**
 * @description A library that automatically finds the best places for this char to run
 * @author Jaenster, Nishimura_Katsuo
 */

//ToDo; Make this work propperly
function AutoMagicFind(Config, Attack) {
	const Promise = require('Promise');
	const GameData = require('GameData');
	const excluded = [0, 133, sdk.areas.MaggotLairLvl1, sdk.areas.MaggotLairLvl2, sdk.areas.MaggotLairLvl3, 134, 135, 136, sdk.areas.AncientsWay, sdk.areas.MooMooFarm];
	const level85 = [sdk.areas.Mausoleum, sdk.areas.PitLvl1, sdk.areas.PitLvl2, sdk.areas.AncientTunnels, sdk.areas.ForgottenTemple, sdk.areas.RuinedFane, sdk.areas.DisusedReliquary, sdk.areas.RiverOfFlame, sdk.areas.ChaosSanctuary, sdk.areas.WorldstoneLvl1, sdk.areas.WorldstoneLvl2, sdk.areas.WorldstoneLvl3, sdk.areas.ThroneOfDestruction];
	// const level85 = [sdk.areas.ForgottenTemple, sdk.areas.RuinedFane, sdk.areas.DisusedReliquary, sdk.areas.RiverOfFlame, sdk.areas.ChaosSanctuary, sdk.areas.WorldstoneLvl1, sdk.areas.WorldstoneLvl2, sdk.areas.WorldstoneLvl3, sdk.areas.ThroneOfDestruction];


	let areas = GameData.AreaData.map(area => ({
		area: area,
		exp: me.diff < 2 ? GameData.areaSoloExp(area.Index) : GameData.areaEffort(area.Index)
	})).sort(me.diff < 2 ? ((a, b) => b.exp - a.exp) : ((a, b) => a.exp - b.exp)).filter(obj => level85.indexOf(obj.area.Index) !== -1);

	// Calculate which areas are calculates as extremely hard
	const notHardAreas = areas.map(x => x.exp).filterHighDistance();
	// Remove areas that are extremely hard
	areas = areas.filter(obj => {
		const stay = notHardAreas.indexOf(obj.exp) !== -1;
		!stay && print('ÿc1 Remove ' + obj.area.LocaleString + ' as it is too hard to beat, avg skill casts to preform a kill: ' + Math.round(obj.exp * 100) / 100);
		return stay;
	});

	Town.doChores();
	areas.forEach((obj, i) => i < 10 && print(obj.area.LocaleString + ' -- ' + obj.exp));


	areas.forEach(obj => {
		print('Going to clear ' + obj.area.LocaleString);
		print(obj.area.Index);
		Pather.journeyTo(obj.area.Index);
		switch (obj.area.Index) {
			case sdk.areas.ChaosSanctuary: //If we are in chaos, simply open all seals
				const star = {x: 7792, y: 5292};
				new Promise(resolve => star.distance < 40 && resolve()).then(function () {
					include('bots/SpeedDiablo.js');
					// Once close to the star, just quickly open all seals
					[sdk.units.DiabloSealVizierInactive, sdk.units.DiabloSealVizierActive,
						sdk.units.DiabloSealSeizActive, sdk.units.DiabloSealInfectorInActive,
						sdk.units.DiabloSealInfectorActive].forEach(seal => {
						Pather.moveToPreset(me.area, 2, seal);
						SpeedDiablo.openSeal(getUnit(2, seal));
					});

					star.moveTo(); // move to the center again
				})


		}

		//Pather.journeyTo(area[0].Index);
		Attack.clearLevel(Config.ClearType);
	})
}