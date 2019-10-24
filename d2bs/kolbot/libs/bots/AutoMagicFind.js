/**
 * @description A library that automatically finds the best places for this char to run
 * @author Jaenster, Nishimura_Katsuo
 */

//ToDo; Make this work propperly
function AutoMagicFind(Config, Attack) {
	const Promise = require('Promise');
	const GameData = require('GameData');
	//const excluded = [0, 133, sdk.areas.MaggotLairLvl1, sdk.areas.MaggotLairLvl2, sdk.areas.MaggotLairLvl3, 134, 135, 136, sdk.areas.AncientsWay, sdk.areas.MooMooFarm];
	const level85 = [sdk.areas.Mausoleum, sdk.areas.PitLvl1, sdk.areas.PitLvl2, sdk.areas.AncientTunnels, sdk.areas.ForgottenTemple, sdk.areas.RuinedFane, sdk.areas.DisusedReliquary, sdk.areas.RiverOfFlame, sdk.areas.ChaosSanctuary, sdk.areas.WorldstoneLvl1, sdk.areas.WorldstoneLvl2, sdk.areas.WorldstoneLvl3, sdk.areas.ThroneOfDestruction];
	// const level85 = [sdk.areas.ForgottenTemple, sdk.areas.RuinedFane, sdk.areas.DisusedReliquary, sdk.areas.RiverOfFlame, sdk.areas.ChaosSanctuary, sdk.areas.WorldstoneLvl1, sdk.areas.WorldstoneLvl2, sdk.areas.WorldstoneLvl3, sdk.areas.ThroneOfDestruction];
	const bosses = {
		Andariel: {
			location: {area: sdk.areas.CatacombsLvl4, x: 22549, y: 9520},
		},
		Mephisto: {
			location: {area: sdk.areas.DuranceOfHateLvl3, x: 17566, y: 8069},
		},
		// Griswold: {
		// 	location: {area: sdk.areas.Tristram, x: 25149, y: 5180},
		// },
		Izual: {
			location: {area: sdk.areas.PlainsOfDespair, preset: {type: 1, classid: sdk.monsters.Izual}},
		}

	};
	Object.keys(bosses).forEach(function (x) {
		bosses[x].isBoss = true;
		// Added an empty done flag
		bosses[x].done = false;
		// Find class id
		bosses[x].classid = Object.keys(sdk.monsters).filter(y => y === x).map(y => sdk.monsters[y]).first();
		if (!!bosses[x].classid) {
			let effort = GameData.monsterEffort(bosses[x].classid, bosses[x].location.area);
			bosses[x].effort = typeof effort === 'object' && effort && effort.effort || 5;
			bosses[x].effort /= 100; // bosses are less effort as an entire area, so tweak it a bit
		}
		bosses[x].area = GameData.AreaData[bosses[x].location.area];
		bosses[x].name = x;
	});
	let areas = GameData.AreaData.map(area => ({
		area: area,
		isBoss: false,
		effort: me.diff < 2 ? GameData.areaSoloExp(area.Index) : GameData.areaEffort(area.Index)
	})).filter(obj => level85.indexOf(obj.area.Index) !== -1);

	Object.keys(bosses).forEach(x => areas.push(bosses[x]));

	areas.sort(me.diff < 2 ? ((a, b) => b.effort - a.effort) : ((a, b) => a.effort - b.effort));

	// Calculate which areas are calculates as extremely hard
	const notHardAreas = areas.map(x => x.effort).filterHighDistance();
	// Remove areas that are extremely hard
	areas = areas.filter(obj => {
		const stay = notHardAreas.indexOf(obj.effort) !== -1;
		!stay && print('ÿc1 Remove ' + obj.area.LocaleString + ' as it is too hard to beat, avg skill casts to preform a kill: ' + Math.round(obj.effort * 100) / 100);
		return stay;
	});

	// Start of game is a good moment to do all chores
	Town.doChores();

	const inTownPromise = () => (new Promise(resolve => me.inTown && resolve()).then(function () {
		// When we happen to be in town, do some basic choring
		new Promise(resolve => !me.inTown && resolve()).then(x => inTownPromise());
		Town.heal();
		Town.buyPotions(); // Buy pots, as some chars run out of mana easiely
		Town.repair(); //ToDo; make a specific amazon check here, due to heavy flow of javelins?
		Town.reviveMerc(true); // get a merc, dont go bo him specificly
	}));

	// Start the promise
	inTownPromise();

	areas.forEach((obj, i) => i < 10 && print((obj.hasOwnProperty('isBoss') && obj.isBoss ? obj.name : obj.area.LocaleString) + ' -- ' + obj.effort));


	areas.forEach(obj => {
		if (obj.isBoss) {
			print('Going to kill ' + obj.name);
			let before = me.area;
			if (!obj.hasOwnProperty('location')) {
				return; // next
			}
			Pather.journeyTo(obj.area.Index);
			// Move to the x,y
			obj.location.hasOwnProperty('x') && obj.location.hasOwnProperty('y') && Pather.moveTo(obj.location.x, obj.location.y);
			// move to the preset
			obj.location.hasOwnProperty('preset') && Pather.moveToPreset(obj.location.area, obj.location.preset.hasOwnProperty('type') && obj.location.preset.type || undefined, obj.location.preset.hasOwnProperty('classid') && obj.location.preset.classid || undefined)
			typeof obj.atArrival === 'function' && obj.atArrival();
		} else {
			print('Going to clear ' + obj.area.LocaleString);
			Pather.journeyTo(obj.area.Index);
		}


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
		if (obj.isBoss) {
			print(obj.classid);
			const unit = getUnits(1, obj.classid).first();
			unit && unit.kill();
		} else {
			Attack.clearLevel(Config.ClearType);
		}
	})
}