/**
 * @author ryancrunchi
 * @description Tombs run.
 */
(function (module,require) {
	const Tombs = function (Config, Attack, Pickit, Pather, Town) {
		if (!Pather.journeyTo(sdk.areas.CanyonOfMagi)) {
			throw new Error("Failed to move to Canyon");
		}

		for (let i = sdk.areas.TalRashasTomb1; i <= sdk.areas.TalRashasTomb7; i += 1) {
			if (!Pather.journeyTo(i, true)) {
				throw new Error("Failed to move to tomb");
			}

			Attack.clearLevelWalk();

			if (!Pather.journeyTo(sdk.areas.CanyonOfMagi, true)) {
				throw new Error("Failed to move to Canyon");
			}
		}

		return true;
	}

	module.exports = Tombs;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );
