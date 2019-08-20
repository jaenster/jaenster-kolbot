/**
 * @description A cache of the current character
 * @author Jaenster
 */

(function (module, require) {
	module.exports = function (suffix) {
		const template = [];

		const filename = 'data/char/' + (me.realm !== '' && me.realm || 'offline') + '.' + me.charname + '.' + suffix + '.json';

		// Cache is either the file itself, or empty;
		let cache = FileTools.exists(filename) && JSON.parse(FileTools.readText(filename)) || template;

		const store = () => FileTools.writeText(filename, JSON.stringify(cache));

		// Some type safe crap
		!Array.isArray(cache) && (cache = []);
		cache === template && store();

		return new Proxy(cache, {
			get: function (_, key) {
				if (typeof cache[key] === 'function') {

					return function (...args) { // fake function
						let ret = cache[key].apply(cache, args);
						store(); // store afterwards
						return ret;
					}
				}
				return cache[key];
			},
			set: function (_, key, value) {
				cache[key] = value;
				store();
			}
		});
	}
})(module, require);