(function (module, require) {

	const QuestData = require('../../../modules/QuestData');
	const walkTo = require('../modules/WalkTo');

	const classids = {
		eye: 553,
		heart: 554,
		brain: 555,

		plainFlail: 173,
		finishedFlail: 174,
	};

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {

		const parts = [
			[[76, 85], classids.eye, 407, 2, 0],
			[[80, 92, 93], classids.heart, 405, 2, 1],
			[[78, 88, 89, 91], classids.brain, 406, 2, 2],
		];

		if (!me.findItem('box') && !me.getCube()) {
			throw Error('Failed to get a cube')
		}
		
		!me.getItem(classids.finishedFlail) && parts    // We only want those that we dont have
			.filter(([, classid]) => !me.getItem(classid))
			.forEach(([area, id, chestid, x, y]) => {
				if (area.includes(me.area)) {
					print('Areadly at ' + me.area);
					// Some how already in one of the areas we wanna go to
					area.splice(0, area.indexOf(me.area)) // remove these elements
				}
				area.forEach(_ => Pather.journeyTo(_));
				delay(100);

				const goTo = area.pop();

				const ps = getPresetUnit(goTo, 2, chestid).realCoords();
				walkTo(ps);

				if (Pather.moveToPreset(goTo, 2, chestid)) {
					me.getQuestItem(id, chestid);
					const item = me.getItem(id);
					me.openCube();
					clickItemAndWait(0, item);
					clickItemAndWait(0, x, y, sdk.storage.Cube);
				}
			});


		Pather.journeyTo(sdk.areas.Travincal);

		const wp = (() => {
			const ps = getPresetUnit(sdk.areas.Travincal, 2, 237/*wp of travincal*/);
			return {x: ps.roomx * 5 + ps.x, y: ps.roomy * 5 + ps.y};
		})();

		// If we dont have the flail, we need to pwn Ismail Vilehand
		if (!me.getItem(174)) {

			// If we dont have the plainFlail, fetch it
			if (!me.getItem(173)) {
				const name = getLocaleString(2863);

				// move to a safe distance away from everything
				Pather.moveTo(wp.x + 85, wp.y - 139);

				const ismail = (function recursive(_) {
					let unit = getUnits(1).filter(unit => unit.name === name).first();
					if (unit) return unit;
					if (_ > 10) {
						throw Error('ismail not found after 10 attempts');
					}

					// if ismail is hiding, we need to stand more close in the pack and search
					const orb = getUnit(2, 404);
					orb.moveTo(orb + rand(-5, 5), orb + rand(-5, 5));
					return recursive(_++); // try again
				})(0);
				ismail.kill();
				me.getQuestItem(classids.plainFlail);
			}

			// move away to be a bit more safe
			Pather.moveTo(wp.x + 85, wp.y - 139);

			// place in cube
			const flail = me.getItem(classids.plainFlail);
			me.openCube();
			clickItemAndWait(0, flail);
			clickItemAndWait(0, 0, 0, sdk.storage.Cube);

			// transmute
			transmute();
			Misc.poll(() => me.getItem(classids.finishedFlail), 4000, 3);
		}


		// If we got the finished flail now
		let finishedFlail = me.getItem(classids.finishedFlail);
		if (finishedFlail) {
			let old;

			// move to our safe location
			Pather.moveTo(wp.x + 85, wp.y - 139);

			// if in cube open the cube
			(finishedFlail.location === sdk.storage.Cube) && !getUIFlag(sdk.uiflags.Cube) && me.openCube();

			// Equip if we havent equiped it yet
			if (finishedFlail.location !== sdk.storage.Equipment) {
				me.switchWeapons(1); // To our secondary slot
				old = finishedFlail.equip();
			}

			// Somehow its on our "other" slot
			finishedFlail.bodyLocation === sdk.body.LeftArmSecondary || finishedFlail.bodyLocation === sdk.body.RightArmSecondary && me.switchWeapons();

			getUIFlag(sdk.uiflags.Cube) && me.cancel(); // close cube

			// find the orb
			const orb = getUnit(2, 404);
			orb.getIntoPosition(5, 0x7/* line of sight*/);

			const beforeMode = orb.mode;
			Misc.poll(() => {
				Pather.moveTo(orb.x - 9, orb.y - 9);
				orb.cast(sdk.skills.Telekinesis); // spam the thing with telekenis
				return orb.mode !== beforeMode;
			}, 5000, 3);

			// move to a safe distance away from everything
			Pather.moveTo(wp.x + 85, wp.y - 139);

			// did we have to equip it for this, and if so, can we unequip it?
			old && old.rollback(); // put old gear back
			me.switchWeapons(0);


			// Wait until exit pops open
			Misc.poll(() => getUnit(2, 386).mode === 2, 10000);

			// Move close to the exit
			const exit = getUnit(2, 386);

			// keep on clicking the exit until we are not @ travincal anymore
			Misc.poll(() => !exit || me.area !== sdk.areas.Travincal || (exit.moveTo() && exit.click() && false),10000,40);

			if (me.area !== sdk.areas.DuranceOfHateLvl1) {
				Pather.moveToExit([sdk.areas.DuranceOfHateLvl1, sdk.areas.DuranceOfHateLvl2]);
			} else {
				Pather.journeyTo(sdk.areas.DuranceOfHateLvl2);
			}

			Pather.getWP(sdk.areas.DuranceOfHateLvl2);
		}




	}

})(module, require);
