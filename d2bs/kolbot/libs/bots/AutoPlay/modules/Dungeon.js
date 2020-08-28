(function (module, require) {

	const AreaData = require('../../../modules/AreaData');

	const Feedback = require('./Feedback');
	const GameAnalyzer = require('./GameAnalyzer');

	module.exports = function (dungeonName, Config, Attack, Pickit, Pather, Town, Misc) {
		print('Running ' + dungeonName);

		// make copy of array
		let dungeons = AreaData.dungeons[dungeonName];

		// strip leading areas, if we are already at that location
		let currentAreaIndex = dungeons.indexOf(me.area);
		if (currentAreaIndex > -1) {
			// Add to skip list
			dungeons.slice(0, currentAreaIndex).forEach(el => GameAnalyzer.skip.push(el));

			// Remove the area
			dungeons = dungeons.slice(currentAreaIndex);
		}


		// print(dungeons);
		const plot = Pather.plotCourse(dungeons.first(), me.area);
		if (!plot) throw Error('couldnt find path');
		const course = plot.course;

		console.debug('here');
		// in case we need to take the WP, we might do so in a different way
		if (plot.useWP) {
			let wpArea = course.first();
			if (!getWaypoint(Pather.wpAreas.indexOf(wpArea))) {
				console.debug('here');
				Pather.getWP(wpArea);
			} else {
				console.debug('here');
				Pather.useWaypoint(wpArea);
			}
		} else {
			console.debug('here');
			Pather.journeyTo(course.first());
		}

		console.debug('here');
		dungeons.every(area => {
			console.debug('Going to area ' + AreaData[area].LocaleString);
			Pather.journeyTo(area);
			if (me.area !== area) return false;

			if (Pather.wpAreas.includes(me.area)) {
				console.debug('Getting waypoint');
				if (!getWaypoint(area)) {
					Feedback.lastDecision = 'Getting waypoint ' + AreaData[area].LocaleString;
					Pather.getWP(me.area);
				}
			}

			GameAnalyzer.skip.push(area);

			switch (me.area) {
				case sdk.areas.TowerCellarLvl5: {
					// cunt-ress pwnage
					let poi = getPresetUnit(me.area, 2, 580);

					if (!poi) return false;

					switch (poi.roomx * 5 + poi.x) {
						case 12565:
							Pather.moveTo(12578, 11043);
							break;
						case 12526:
							Pather.moveTo(12548, 11083);
							break;
					}

					Attack.clear(20, 0, getLocaleString(2875)); // The Countess
				}
			}
			return true;
		});
	}

})(module, require);