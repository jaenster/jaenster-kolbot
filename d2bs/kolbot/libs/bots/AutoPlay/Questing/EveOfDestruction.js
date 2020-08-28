(function (module, require) {

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {

		const getMonsters = () => {

		};

		const spots = {
			northnorthwest: {x: 15083, y: 5012}, // north north west
			// northwest: {x: 15072, y: 5002}, // north west (hiding in cornor)

			north: {x: 15089, y: 5006}, // north
			northnortheast: {x: 15106, y: 5013}, // north north east
			// northeast: {x: 15118, y: 5002}, // north east (hiding in other cornor)
			east: {x: 15118, y: 5026}, // east

			southeast: {x: 15111, y: 5041}, // south east
			southsoutheast: {x: 15103, y: 5043}, // south south east
			south: {x: 15094, y: 5043}, // south
			southsouthwest: {x: 15084, y: 5040}, // south south west
			southwest: {x: 15077, y: 5034}, // south west

			west: {x: 15078, y: 5026}, // west
		};

		if (me.area !== sdk.areas.WorldstoneChamber) {
			Pather.journeyTo(sdk.areas.ThroneOfDestruction);
		}

		if (me.area === sdk.areas.ThroneOfDestruction) {
			let baalSitting = getUnit(1, 543);
			const center = {x: 15094, y: 5028};
			const shouldDodge = (coord) => {
				const monsters = getUnits(1).filter(unit => unit && !unit.dead && unit.getStat(172) !== 2 /*friendly npc/merc*/).map(unit => unit.gid);
				return getUnits(3)
					// for every missle that isnt from our merc
					.filter(missile => missile && monsters.indexOf(missile.owner) > -1)
					// if any
					.some(missile => Math.abs(coord.x - missile.targetx) < 7
						&& Math.abs(coord.y - missile.targety) < 7
						&& Math.abs(coord.x - missile.x) < 13
						&& Math.abs(coord.y - missile.y) < 13
					);
			};

			const closestMonsterOnsSpot = (spot) => getUnits(1)
				.filter(unit => unit && !unit.dead && unit.getStat(172) !== 2 /*friendly npc/merc*/)
				.sort((a, b) => getDistance(spot, a) - getDistance(spot, b)).first() || {distance: Infinity};

			const calcNewSpot = () => {
				let result = Object.keys(spots)
					// Exclude a spot
					.filter(spot => {
						const distance = closestMonsterOnsSpot(spots[spot]).distance;
						return distance > 7 && distance < 37; // not to close, not too far
					})
					// Do not choose a spot i wanna dodge anyway
					.filter(spot => !shouldDodge(spots[spot]))
					// Sort on least distance of diablo (or the star if he didnt spawned yet)
					.sort((a, b) => closestMonsterOnsSpot(spots[a]).distance - closestMonsterOnsSpot(spots[b]).distance);

				let best = 'north'; // default
				print(result.toSource());
				print(result.length);
				if (result.length > 1) {
					if (getDistance(spots[result[0]], closestMonsterOnsSpot(spots[result[0]])) > 10) {
						best = result[0]; // still on a safe distance
					} else {
						best = result[1];
					}
				} // second best is best
				if (result.length === 1) best = result[0]; // with a single option, chose the single option

				print(best);
				return best;
			};

			let ___recusion = 0, spot, done = false;
			const Worker = require('../../../modules/Worker');
			Worker.runInBackground.baalAvoid = function () {

				// Avoid double code runningz
				if (___recusion) return true; // keep on looping
				___recusion++;

				// If dia is there and dia is alive
				let dodge = shouldDodge(me/*depends on me*/);

				if (dodge) {
					print('DODGE');
					(spot = spots[calcNewSpot()]).moveTo() // move to this new found spot
				}
				return ___recusion-- || !done;
			};

			do {
				if (spots.north.distance > 60) {
					// move to the closest spot
					let closest = Object.keys(spots).sort((a, b) => spots[a].distance - spots[b].distance).first();
					(spots[closest]).moveTo();
					baalSitting = getUnit(1, 543)
				}

				let nearest = closestMonsterOnsSpot(me);
				if (!spot || nearest.distance < 10 || nearest.distance > 37) {
					spot = spots[calcNewSpot()];
					calcNewSpot()
				}

				if (spot.distance > 3) {
					spot.moveTo();
					// recalculate nearest
					nearest = closestMonsterOnsSpot(me);
				}

				print(nearest.toSource());
				if (nearest && nearest.distance < 40) {
					nearest.cast(sdk.skills.Blizzard);
				} else {
					me.cast(sdk.skills.Blizzard,0,center.x,center.y);
				}

				// The entire point of baal is simply that he doesnt see anything near him
				print(!!baalSitting);
			} while (!!baalSitting);
			done = true;

			print('Ok done with throne');
		}

		if (me.area !== sdk.areas.WorldstoneChamber) {
			Pather.journeyTo(sdk.areas.ThroneOfDestruction);
			while (getUnit(1, 543)) delay(30);
			delay(200);
			var portal = getUnit(2, 563);
			if (portal) while(me.area === sdk.areas.ThroneOfDestruction) portal.moveTo().click();
		}

		if (me.area === sdk.areas.WorldstoneChamber) {
			Pather.moveTo(15147,5936);
			getUnit(1,544).kill();
		}
	}
})(module, require);
