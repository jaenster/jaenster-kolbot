(function (module, require) {
	const Delta = new (require('../../../modules/Deltas'));

	function LazyLoading(fetcher, refresh = undefined) {
		typeof refresh === 'function' && Delta.track(refresh, () => this.cache = undefined);

		let cache;
		this.get = function () {
			if (typeof cache === 'undefined') {
				cache = fetcher();
			}
			return cache;
		};
		this.set = function (v) {
			cache = v;
		}
	}

	module.exports = LazyLoading;

})(module, require);