module.exports = function (settings) {

	let done = false, ___recusion = 0;
	print('dodgy attack');

	let dst = 23;

	const safeSpots = settings.spots;
	const center = safeSpots[settings.default]; // the default is the center

	const shouldDodge = (coord) => {
		return monster && getUnits(3)
			// for every missle that isnt from our merc
			.filter(missile => missile && monster && monster.gid === missile.owner)
			// if any
			.some(missile => {
				let xoff = Math.abs(coord.x - missile.targetx),
					yoff = Math.abs(coord.y - missile.targety),
					xdist = Math.abs(coord.x - missile.x),
					ydist = Math.abs(coord.y - missile.y);

				// If missile wants to hit is and is close to us
				return xoff < 7 && yoff < 7 && xdist < 13 && ydist < 13;
			});
	};

	let monster;
	const calcNewSpot = () => {
		let result = Object.keys(safeSpots)
			// Exclude a spot
			.filter(spot => getDistance(safeSpots[spot], monster || center) > 7)
			.filter(spot => getDistance(safeSpots[spot], monster || center) < 37)
			// Do not choose a spot i wanna dodge anyway
			.filter(spot => !shouldDodge(safeSpots[spot]))
			// Sort on least distance of diablo (or the center if he didnt spawned yet)
			.sort((a, b) => {
				return getDistance(safeSpots[a], monster || center) - getDistance(safeSpots[b], monster || center)
			});

		switch (true) {
			case result.length === 1:
			case result.length > 1 && getDistance(safeSpots[result[0]], monster) > 10:
				return result[0];
			case result.length > 1:
				return result[1]; // second best is best if the best is too close
		}
		return settings.default;
	};

	const Worker = require('../../../modules/Worker');
	Worker.runInBackground.avoidMonster = function () {

		// Avoid double code runningz
		if (___recusion) return true; // keep on looping
		___recusion++;

		// If dia is there and dia is alive
		let dodge = monster && !monster.dead && shouldDodge(me/*depends on me*/);

		if (dodge) {
			print('DODGE');
			(spot = safeSpots[calcNewSpot()]).moveTo() // move to this new found spot
		}
		return ___recusion-- || !done;
	};
	let spot, line;
	do {
		monster = getUnit(1, settings.monsterid);
		monster && (line = new Line(me.x, me.y, monster.x, monster.y, 0x84, true));

		// Get the second closest spot to diablo, so if he moves to you, you move away, but not far, so he keeps on chasing you
		if (!spot || monster && (monster.distance < 10 || monster.distance > 35)) {
			spot = safeSpots[calcNewSpot()];
		}

		spot && print(spot.toSource());
		spot && spot.distance > 3 && spot.moveTo();

		monster && monster.cast(settings.skill) || me.cast(settings.skill, 0, center.x, center.y);
		delay(10);
	} while (!monster || !monster.dead);

}