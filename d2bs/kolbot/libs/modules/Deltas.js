/**
 * @author Nishimura-Katsuo
 * @description a basic implementation of delta's
 */
(function (module, require) {
	const Worker = require('../modules/Worker');
	let instances = 0;


	/** @constructor
	 * @class Delta */
	module.exports = function (trackers) {
		let active = true;
		this.values = (Array.isArray(trackers) && (Array.isArray(trackers.first()) && trackers || [trackers])) || [];
		/** @methodOf Delta */
		this.track = function (checkerFn, callback) {
			return this.values.push({fn: checkerFn, callback: callback, value: checkerFn()});
		};
		/** @methodOf Delta */
		this.check = function () {
			this.values.some(delta => {
				let val = delta.fn();

				if (delta.value !== val) {
					let ret = delta.callback(delta.value, val);
					delta.value = val;

					return ret;
				}

				return null;
			});
		};

		this.destroy = () => active = false;

		Worker.runInBackground['__delta' + (instances++)] = () => active && (this.check() || true);
		return this;
	};

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);