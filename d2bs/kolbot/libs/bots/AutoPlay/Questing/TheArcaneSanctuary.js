(function(module,require) {

	const QuestData = require('../../../modules/QuestData');

	module.exports = function (quest,Config, Attack, Pickit, Pather, Town, Misc) {
		// Log the quest status
		QuestData.logQuestStatuses(quest);

		const log = QuestData.fetchQuestArray(quest);

		if (log[0]) return; // did it

		Pather.useWaypoint(74);

		if (!Pather.moveToPreset(me.area, 2, 357, -3, -3)) {
			throw new Error("Failed to move to Summoner");
		}

		// open the journal
		getUnit(2, 357).cast(sdk.skills.Telekinesis);
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