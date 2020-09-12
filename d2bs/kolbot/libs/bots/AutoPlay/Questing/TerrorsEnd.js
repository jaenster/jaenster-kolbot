(function (module, require) {


	const walkTo = require('../modules/WalkTo');
	const myWalkTo = seal => walkTo(seal, false, 30);
	const LazyLoading = require('../modules/LazyLoading');
	console.debug(LazyLoading.toSource());

	const activeSeals = [sdk.units.DiabloSealVizierActive, sdk.units.DiabloSealInfectorActive, sdk.units.DiabloSealSeizActive];


	const Diablo = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {


		if (me.area !== sdk.areas.ChaosSanctuary) {
			Pather.journeyTo(sdk.areas.RiverOfFlame);
			const exit = getArea().exits.filter(exit => exit.target === sdk.areas.ChaosSanctuary);
			walkTo(exit, false, 30);
		}
		walkTo(Diablo.star,false, 30);


		Diablo.part(Diablo.vizSettings);
		Diablo.part(Diablo.seizSettings);
		Diablo.part(Diablo.infectorSettings);

	};

	Diablo.part = function (settings) {
		const seals = settings.seals, monsterId = settings.monster;

		getPresetUnits(108, 2).filter(ps => seals.includes(ps.id))
			.forEach(seal => {

				myWalkTo(seal);
				Diablo.openSeal(seal.unit);


				if (activeSeals.includes(seal.id)) {

					const [x,y] = (_ => {
						let sealy = seal.roomy * 5 + seal.y;
						switch (seal.unit.classid) {
							case sdk.units.DiabloSealInfectorActive:
								return sealy === 7773 ? [me.x, me.y] : [7928, 5295];
							case sdk.units.DiabloSealSeizActive:
								return sealy === 7893 ? [7771, 5196] : [7798, 5186];
						}
						//case sdk.units.DiabloSealVizierActive:
						return sealy === 5275 ? [7691, 5292] : [7695, 5316]
					})();

					myWalkTo({x: x, y:y},false, 30);
				}

			})
	};

	Diablo.star = {x: 7792, y: 5292};

	Diablo.openSeal = function (seal) {
		for (let i = 0; i < 5; i += 1) {
			if (seal.mode) return true;

			// click and/or interact with the thing
			seal[seal.classid === 394 ? 'click' : 'interact']();

			delay(seal.classid === 394 ? 1000 : 500);

			if (seal.mode || i === 5) return !!seal.mode;

			if (seal.classid === 394 && [seal.x + 15, seal.y].validSpot) { // de seis optimization
				Pather.moveTo(seal.x + 15, seal.y);
			} else {
				Pather.moveTo(seal.x - 5, seal.y - 5);
			}

			delay(500);
		}
		return seal.mode; // cant come here, but still
	};

	Object.defineProperties(Diablo, {
		vizSettings: new LazyLoading(() => {
			return {
				seals: [sdk.units.DiabloSealVizierInactive, sdk.units.DiabloSealVizierActive],
				monster: sdk.locale.monsters.GrandVizierOfChaos,
			};
		}),

		seizSettings: new LazyLoading(() => {
			return {
				seals: [sdk.units.DiabloSealSeizActive],
				monster: sdk.locale.monsters.LordDeSeis,
			};
		}),

		infectorSettings: new LazyLoading(() => {
			return {
				seals: [sdk.units.DiabloSealInfectorInActive, sdk.units.DiabloSealInfectorActive],
				monster: sdk.locale.monsters.InfectorOfSouls,
			}
		}),
	});


	module.exports = Diablo;
})(module, require);