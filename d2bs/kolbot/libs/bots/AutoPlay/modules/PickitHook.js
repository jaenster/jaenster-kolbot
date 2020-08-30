/**
 * @author Jaenster
 * @description Pickit hook. I hate writing nip files
 */

(function (module, require) {

	const Pickit = require('../../../modules/Pickit');

	// so its a class with static functions
	function Hook() {

	}

	const itemCacheKey = md5('PickitHookKey');

	// calculate if you want to pick the item/buy/keep/sell the item
	Hook.want = function (item) {
		return item[itemCacheKey] = (function () {

			// If we already excluded this item, lets not rerun this (saves cycles)
			if (item.hasOwnProperty(itemCacheKey) && !item[itemCacheKey]) return false;

			if (!item) return false; // We dont want an item that doesnt exists

			// Do some calculation why we want an item
			return false;
		}).call();
	};

	// now that we got the item, now what?
	Hook.handle = function (item) {

		// whatever
		item.drop();
	};

	Hook.id = 'AutoPlayPickit';
	module.exports = Hook;

	// Register this as pickit hook
	Pickit.hooks.push(Hook);

})(module, require);

