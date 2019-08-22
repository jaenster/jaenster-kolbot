/**
 * @description Some out of game handling
 * @author Jaenster
 */
(function (module, require) {
	const Worker = require('Worker');
	const LocationEvents = new (require('Events'))();
	// Deal with locations
	Worker.runInBackground.outGame = (new function () {
		let oldLocation = -1;
		let tick = getTickCount();
		this.update = () => {
			if (getTickCount() - tick < 1000) {
				return true;
			}
			if (me.ingame) {
				oldLocation = null;
				return true;
			}
			let location = getLocation();

			if (oldLocation !== location) {
				print('Trigger event ' + Object.keys(sdk.locations).find(key => sdk.locations[key] === location));
				LocationEvents.trigger.apply(LocationEvents, [location, oldLocation]);

				LocationEvents.trigger('location', [location, oldLocation]);
				oldLocation = location;
			}

			return true; // Always return true, so we keep running
		}
	}).update;

	module.exports = {
		on: LocationEvents.on,
		once: LocationEvents.once,
		trigger: LocationEvents.trigger,
	};

})(module, require);