(function(module,require) {

	const QuestData = require('../../../modules/QuestData');

	const walkTo = require('../modules/WalkTo');

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {
		// Log the quest status

		const log = QuestData.fetchQuestArray(quest);

		if (log[0]) return; // did it

		Pather.journeyTo(sdk.areas.ArcaneSanctuary);
		Pather.getWP(sdk.areas.ArcaneSanctuary);

		const ps = getPresetUnit(me.area, 2, 357).realCoords();
		walkTo(ps);

		// open the journal
		let journal = getUnit(2, 357);
		walkTo(journal);
		journal.moveTo();
		journal.interact();
		delay(500);
		me.cancel();

		// Take wp first, go back to act 1 it can work around the red portal delay
		if (Pather.usePortal(sdk.areas.CanyonOfMagi)) {
			let wp = getUnit(2, "waypoint");
			wp.mode !== 2 && wp.cast(sdk.skills.Telekinesis); // activate it
			Misc.poll(() => wp.mode === 2);
			wp.cast(sdk.skills.Telekinesis); // activate it again
			wp.interact(sdk.areas.RogueEncampment);

			delay(500);

			// In act 1 now
			wp = getUnit(2, "waypoint");
			wp.cast(sdk.skills.Telekinesis); // activate it again
			wp.interact(sdk.areas.CanyonOfMagi);

			delay(500);
			// Go back in the portal
			Pather.getPortal(sdk.areas.ArcaneSanctuary).cast(sdk.skills.Telekinesis);
		}

		getUnit(1,250).kill();

		// Going to Canyon once again
		Pather.usePortal(sdk.areas.CanyonOfMagi);


	}
})(module,require);