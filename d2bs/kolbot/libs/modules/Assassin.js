/**
 *  @description Some specific Assassin additions
 *  @author Jaenster
 */

(function (module, require) {
	const Promise = require('Promise');
	const Config = require('Config');
	const Worker = require('Worker');
	const Pather = require('Pather');

	// Cast burst of speed in town, fade before we leave town
	const usePortal = Pather.usePortal, useWaypoint = Pather.useWaypoint;
	const recastFade = () => Config.UseFade && !me.getState(sdk.states.Fade) && me.cast(sdk.skills.Fade);
	const castBoS = () => Config.UseFade && !me.getState(sdk.states.BurstOfSpeed) && me.cast(sdk.skills.BurstOfSpeed) || true;

	Pather.usePortal = function (...args) { // If you use a portal in town, we can only leave town
		if (me.inTown) {
			Town.move('portal');
			var portal = getUnit(2, "portal");
			portal && portal.moveTo(); // just move to any portal
			recastFade();
		}
		return usePortal.apply(this, args);
	};
	Pather.useWaypoint = function (...args) {
		// cast fade if we leave town
		if (me.inTown && Town.move('waypoint')) {
			let wp = getUnit(2, "waypoint");
			wp.moveTo();
			recastFade();
		}
		return useWaypoint.apply(this, args);
	};


	let inTown = false;
	Worker.runInBackground.AssaBoS = function () {
		if (me.inTown && !inTown && me.hasOwnProperty('cast') /*gets called already very early*/) {
			inTown = true;
			// We are in town now
			me.cast(sdk.skills.BurstOfSpeed);
		}

		return true;
	};
	module.exports ={};
})(module, require);
