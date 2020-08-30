/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {

	const AreaData = require('../../modules/AreaData');

	/** @template T - any object
	 * @template K - key of T
	 * @type {function(T, K, function(function&T[K], typeof T[K])): number}  */
	function whatever() {};

	/**
	 * @template T {Object}
	 * @template K {keyof T}
	 * @param {T} Obj
	 * @param {K} name
	 * @param {(T[K], infer T[K])}fn
	 * @constructor
	 */
	function Overload(Obj, name, fn) {
		this.obj = Obj;
		this.name = name;
		this.original = Obj[name];
		this.fn = fn;
		this.installed = false;

		Overload.instances.push(this);
	}
	// static variable
	Overload.instances = [];

	Overload.prototype.remove = function () {
		if (this.installed) {
			console.debug('removing ' + this.obj.name + '.' + this.name);
			this.obj[this.name] = this.original;

			this.installed = false;
		}
	};

	Overload.prototype.install = function () {
		if (!this.installed) {
			console.debug('Overloading ' + this.obj.name + '.' + this.name);
			this.obj[this.name] = this.fn.bind(this.obj, this.original);

			this.installed = true;
		}
	};

	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
		const from = Overload.instances.length;

		new Overload(Pather, 'journeyTo', /**@this Pather*/ function (original, ...args) {

			return original.apply(Pather,args);

			// If we can teleport we just use the original Pather.journeyTo
			const useTeleport = this.useTeleport();

			// If we walk however, we might want to do something else with the journey to
			const target = this.plotCourse(area, me.area);

			// in the odd case we are in the field, check if we can take a local waypoint
			if (target.useWP && !me.inTown) {
				let takeLocalWP = false;

				// Get town distances

				// get local copies
				const area =  AreaData[me.area];
				const townArea = area.townArea();

				// location we come @ taking waypoint
				const [tpx,tpy] = Town.ActData[area.Act-1].spot.portalspot;

				// location we want to walk to after tp
				const [wpx,wpy] = Town.ActData[area.Act-1].spot.waypoint;

				// calculate distance between tp -> wp
				const townDistance = Pather.getWalkDistance(wpx,wpy,townArea.Index,tpx,tpy);

				// get real world distance

				// where is the nearst waypoint
				let preset = area.waypointPreset();

				const realWorldDistance = Pather.getWalkDistanceLongDistance(me,preset.realCoords());

				// Do we want to use the nearst waypoint, or do we want to walk?
				// If the town distance is just twice the local distance, or if realWorldDistance is just low

				let tpBook = me.findItem("tbk", 0, 3);
				let tpScroll = me.findItem("tsc", 0, 3);
				switch(true) {

					// If its very far away, take tpScroll to go to town
					case tpScroll && !tpBook && realWorldDistance > 300: {
						tpScroll.interact();
						let portal = Misc.poll(() => (portal => portal && portal.getParent() === me.name && portal.distance < 20)(getUnit(2, "portal")));

						portal && Pather.usePortal(null, null, portal);
						break;
					}

					case !tpBook && realWorldDistance > 300: {
						console.debug('We have to walk that far, i rather give up');
						quit();
						break;
					}

					case realWorldDistance < townDistance*2: // waypoint is nearby
					case realWorldDistance < 40: // waypoint is relatively close
					case me.gold < Town.LowGold/2: // very low on gold
					case !tpBook: // If no book



						break;

				}

				// If nearest waypoint is here, in the same area, check if walking to it is shorter as walking in town
				if (preset) {
					Pather.getWalkDistance();
				}

			}

		});


		Overload.instances.slice(from).forEach(ol => ol.install());
		return {
			rollback: () => {
				Overload.instances.forEach(el => el.remove());
			}
		}
	};
	module.exports.Overload = Overload;

})(module, require);