(function (module, require) {
	const QuestData = require('../../../modules/QuestData');


	Unit.prototype.lure = function (path) {

		const merc = me.getMerc();
		for (let i = 0; i < 10; i++) if (path.every(node => {

			// walk to next node
			me.moveTo(node.x, node.y);

			// see if it targets us (aka coming to us)
			return Misc.poll(() => {
				merc && merc.distance > 4 && me.cast(sdk.skills.Teleport, undefined, me.x, me.y, undefined, true);

				return getDistance(me, this.targetx && this.targety) < 4 && this.distance < 10;
			}, 4000, 40)
		})) return true;

		return false;
	};

	module.exports = function (quest, Config, Attack, Pickit, Pather, Town, Misc) {
		const TownPrecast = require('../../../modules/TownPrecast');

		if (me.area < sdk.areas.DuranceOfHateLvl1) {
			if (!getWaypoint(26/*wp areas of Dura2*/)) {
				console.debug('we dont have the magical waypoint we suposed to have');

				Pather.journeyTo(sdk.areas.Travincal);

				// dont use the exit
				Pather.moveToExit(sdk.areas.DuranceOfHateLvl1, false);


				const trapDoor = getUnit(2, 386);

				Misc.poll(()=> {
					if (me.area === sdk.areas.Travincal) {
						trapDoor.moveTo();
						trapDoor.click();
					}
					return me.area === sdk.areas.DuranceOfHateLvl1
				},  6000,40);

				Pather.journeyTo(sdk.areas.DuranceOfHateLvl2);
				Pather.getWP(sdk.areas.DuranceOfHateLvl2);
				Pather.useWaypoint(sdk.areas.KurastDocktown);
			}
		}


		TownPrecast();
		if (!Pather.journeyTo(sdk.areas.DuranceOfHateLvl3)) {
			throw new Error("Failed to move to Durance Level 3");
		}

		// if we did the quest
		if (me.getQuest(quest.index, 0)) {
			me.moveTo(17590, 8068); // Save time and activate the river bank
			delay(400);
		}

		// Get in range
		me.moveTo(17571, 8071);

		let spots = {
			rigth: {x: 17554, y: 8054},
			left: {x: 17554, y: 8077},
			top: {x: 17554, y: 8066},
			bottom: {x: 17565, y: 8070},
			center: {x: 17551, y: 8066},
			topright: {x: 17539, y: 8054},
			topleft: {x: 17539, y: 8072},
			bottomright: {x: 17565, y: 8059},
			bottomleft: {x: 17565, y: 8081},
		};

		require('../modules/DodgeAttack')({
			spots: spots,
			monsterid: 242,
			default: 'center',
			skill: sdk.skills.FireBall,
		});
		Pickit.pickItems();
	}

})(module, require);