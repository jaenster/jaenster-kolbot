/**
 * @author Nishimura-Katsuo
 * @description a basic implementation of delta's
 */
(function (module, require) {
	const Worker = require('Worker');
	let instances = 0;

	module.exports = function () {
		this.values = [];
		this.track = function (checkerFn, callback) {
			this.values.push({fn: checkerFn, callback: callback, value: checkerFn()});
		};
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

		Worker.runInBackground['__delta' + (instances++)] = () => this.check() || true;
		return this;
	};

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);