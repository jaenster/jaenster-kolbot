(function (module, require) {


	const calculateBestSpot = function (center, skillRange) {
		let coords = [];
		for (let i = 0; i < 360; i++) {
			coords.push({
				x: Math.floor(center.x + (skillRange / 2) * Math.cos(i) + .5),
				y: Math.floor(center.y + (skillRange / 2) * Math.sin(i) + .5),
			});
		}
		return coords.filter((e, i, s) => s.indexOf(e) === i); // only unique spots
	};

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {
		const Skills = require('../../../modules/Skills');
		let altar, i, j,
			boss = [22488, 22489, 22490]; //Korlic, Madawc, Talic

		Pather.journeyTo(sdk.areas.ArreatSummit);
		Pather.moveTo(10052, 12634);
		altar = Misc.poll(() => getUnit(2, 546), 4000, 3);

		do {
			// Pather.moveToUnit(altar);
			Precast.doPrecast(true);
			altar.cast(sdk.skills.Telekinesis);
			me.cancel();
			print('Are they gone?');
			// Are they gone?
			Misc.poll(() => getUnit(1, 475), 3000, 10);
			me.cancel();
			print('Are they there?');
			Misc.poll(() => getUnit(1, 542), 3000, 10);
			me.cancel();
		} while (altar.mode !== 2);

		const safeSpots = calculateBestSpot(altar, 30);

		let units, mySpot = me;
		while (getUnits(2, 475).length !== 3 /*as long there are no statues*/) {

			print('Just attacking?');
			units = getUnits(1).filter(unit=>[540,541,542].includes(unit.classid)).filter(unit => !unit.dead);
			if (!units.length) {
				break;
			} // they arent here?
			// In case our spot is invaded by any of the ancients
			if (units.filter(a => a && !a.dead && a.distance < 7).length) {
				print('eh someone is too close =O');

				let avgdis = safeSpots.reduce((acc, cur) => acc + cur.distance, 0) / safeSpots.length;

				let possibleSpots = safeSpots.filter(spot => avgdis < spot.distance);
				mySpot = possibleSpots[~~rand(0, possibleSpots.length-1)];

				print(mySpot.x + ',' + mySpot.y);
			}

			if (mySpot.distance > 3) {
				print('moving to my new spot?');
				mySpot.moveTo();
			}
			try {
				// that one that is near
				const near = units.filter(a => a && !a.dead).sort((a, b) => a.distance - b.distance).first();
				let staticCap = [0, 33, 50][me.diff];
				let percentLeft = (near.hp * 100 / near.hpmax);
				if (near && Skills.range[sdk.skills.StaticField] < near.distance && staticCap < percentLeft) {
					near && near.cast(sdk.skills.StaticField);
				}
				near && near.cast(sdk.skills.FireBolt);
				delay(10);
			} catch (e) {
				if (e.message.indexOf('undefined') === -1) throw e; // Unit can suddenly be gone on death
			}
		}

		delay(2000);
		me.cancel();

		Pather.moveTo(10052, 12576); // Close to the door
		const door = Misc.poll(() => getUnit(2, 547));
		Misc.poll(() => {
			!door.mode && me.cast(sdk.skills.Telekinesis);
			return !door.mode
		});

		Pather.moveToExit([sdk.areas.WorldstoneLvl1,sdk.areas.WorldstoneLvl2], true);
		Pather.moveToPreset(me.area, 2, 494);

		const wp = getUnit(2, 494);

		// if waypoint isnt active yet
		wp.mode !== 2 && wp.cast(sdk.skills.Telekinesis);
		Misc.poll(() => wp.mode,2000,20);

		return !!me.getQuest(39, 0) || !!me.getQuest(39, 1);
	}
})(module, require);