/**
 * @param args
 * @returns {Unit[]}
 */
function getUnits(...args) {
	let units = [], unit = getUnit.apply(null, args);

	if (!unit) {
		return [];
	}
	do {
		units.push(copyUnit(unit));
	} while (unit.getNext());
	return units;
}

const clickItemAndWait = (...args) => {
	let before,
		itemEvent = false,
		timeout = getTickCount(),
		gamePacket = bytes => bytes && bytes.length > 0 && bytes[0] === 0x9D /* item event*/ && (itemEvent = true) && false; // false to not block

	addEventListener('gamepacket', gamePacket);

	clickItem.apply(undefined, args);
	delay(Math.max(me.ping * 2, 250));

	before = !me.itemoncursor;
	while (!itemEvent) { // Wait until item is picked up.
		delay(3);

		if (before !== !!me.itemoncursor || getTickCount() - timeout > Math.min(1000, 100 + (me.ping * 4))) {
			break; // quit the loop of item on cursor has changed
		}
	}

	removeEventListener('gamepacket', gamePacket);
	delay(Math.max(me.ping, 50));
	itemEvent = false;
};

(function (global, original) {
	let firstRun = true;
	global['getUnit'] = function (...args) {
		const test = original(1);
		// Stupid reference thing

		if (firstRun) {

			delay(1000);
			firstRun = false;
		}


		let [first] = args, second = args.length >= 2 ? args[1] : undefined;

		const ret = original.apply(this, args);

		// deal with fucking bug
		if (first === 1 && typeof second === 'string' && ret && ((me.act === 1 && ret.classid === 149) || me.act === 2 && ret.classid === 268)) {
			D2Bot.printToConsole('Annoying d2 bug - getUnit not working');
			D2Bot.printToConsole(ret.toSource());


			console.debug('test: ' , getUnit(first, -1, -1, ret.gid));


			console.debug(ret.toSource());

			// in tcp/ip we quit the current game
			if (me.gameserverip && !me.realm) {
				quit();
			} else {
				// in single player we exit the entire game
				D2Bot.restart();
			}
		}

		return original.apply(this, args);
	}
})([].filter.constructor('return this')(), getUnit);

