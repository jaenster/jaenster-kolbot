/**
 * @description Auto statter
 * @author Jaenster, dzik
 *
 *
 * @example
 {
	strength: [50, 2],
	dexterity: [0, 3],
	vitality: [200, 2],
	energy: [50, 1],
},
 */




(function (module, require) {
	const Worker = require('Worker');
	const PacketBuilder = require('PacketBuilder');

	function checkStat(stat, items) {
		let bonus = 0;
		for (let i = 0; i < items.length; i++) {
			bonus = bonus + items[i].getStatEx(stat);
		}
		return me.getStat(stat) - bonus;
	}

	function stat(build) {
		// Stat the char to a specified build. Thanks dzik <3
		let points, stat, items, one, before, tick,
			missing = [0, 0, 0, 0],
			send = [0, 0, 0, 0],
			names = ["strength", "energy", "dexterity", "vitality"];

		if (!me.ingame || !me.getStat(4)) {
			return; // Pointless to check without points or when we are not in game
		}
		points = me.getStat(sdk.stats.Statpts); // how many points we can use.

		// get equiped items
		items = me.findItems(null, 1, 1); // mode 1 = equipped, location 1 = body

		// In case of xpac we want to look for charms too (they can give +str/dex)
		if (!!me.gametype) for (let i = 603; i <= 605; i++) { // charms in inventory
			let charms = me.findItems(i, null, 3);
			if (!!charms.length) {
				items = items.concat(charms);
			}
		}


		// check for the stats at the items
		for (let i = 0; i < 4; i++) {
			stat = checkStat(i, items);
			if (stat < build[names[i]][0]) {
				missing[i] = build[names[i]][0] - stat;
			}
		}

		while (!!points) { // in case we have more than one level at once.
			for (let i = 0; i < 4; i++) {
				one = Math.max(Math.min(build[names[i]][1], missing[i] - send[i], points), 0);
				send[i] += one;
				points -= one;
			}
		}
		for (let i = 0; i < 4; i++) {
			if (send[i] > 32) { // Can't send more as 32 at a time, so lets not do that
				points += send[i] - 32;
				send[i] = 32;
			}
		}

		// Actually send the right packet to do so
		for (let i = 0; i < 4; i++) {
			if (!send[i]) {
				continue; // No need to stat this
			}
			before = me.getStat(i);
			(new PacketBuilder).byte(0x3A, i, send[i] - 1).send();

			tick = getTickCount();
			while (true) {
				if (getTickCount() - tick > 1e4) {
					return;
				}
				if (before < me.getStat(i)) {
					print("Added " + send[i] + " to " + names[i], 9);
					break;
				}
				delay(3);
			}
		}
	}

	// Only start the worker for the main thread
	if (getScript(true).name.toLowerCase() === 'default.dbj') {
		/** @return {boolean} */
		Worker.runInBackground.AutoStat = function () {
			me.getStat(sdk.stats.Statpts) && stat(module.exports.stats);
			return true; // keep looping
		};
	}

	module.exports = { // Default stats
		strength: [156, 1],
		dexterity: [0, 0],
		vitality: [400, 3], // Last but not least
		energy: [0, 0],
	};

})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );