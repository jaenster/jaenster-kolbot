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


(function(global,print) {
	global['console'] = global['console'] || (function() {
		const console = {};

		const argMap = el => typeof el === 'object' && el /*not null */ && JSON.stringify(el) || el;

		console.log = function(...args) {
			// use call to avoid type errors
			print.call(null,args.map(argMap).join(','));
		};

		console.printDebug = true;
		console.debug = function(...args) {

			if (console.printDebug) {
				const stack = new Error().stack.match(/[^\r\n]+/g),
					filenameAndLine = stack && stack.length && stack[1].substr(stack[1].lastIndexOf('\\') + 1) || 'unknown:0';

				this.log('ÿc:[ÿc:' + filenameAndLine  + 'ÿc:]ÿc0 '+args.map(argMap).join(','));
			}
		};

		return console;

	})()

})([].filter.constructor('return this')(),print);