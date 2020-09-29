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
			return false; // Do some calculation why we want an item
		}).call();
	};

	// now that we got the item, now what?
	Hook.handle = function (item) {

	};

	// shoppable
	Hook.shop = function(items) {

		const tome = me.findItem(sdk.items.idtome, 0, sdk.storage.Inventory);
		if (tome) return false; // already have

		const shopableTome = items.filter(item => item.classid === sdk.items.idtome).first();
		if (shopableTome && me.gold > (Config.LowGold / 2)) {
			return [shopableTome]; // shop the tome
		}

	};

	Hook.id = 'AutoPlayPickitHooks';
	module.exports = Hook;

	// Register this as pickit hook
	Pickit.hooks.push(Hook);

})(module, require);

