/**
 *    @filename    HeartBeat.js
 *    @author      jaenster
 *    @desc        Keep a link with d2bot#. If it's lost, the d2 window is killed
 */

function main() {
	print('ÿc2Heartbeatÿc0 :: started sequence');
	const filename = 'data/' + me.profile + '.json';
	if (!FileTools.exists(filename)) {
		throw new Error('Data file needs to exists ' + filename);
	}

	let content = File.open(filename, 0);// open data file
	if (!content) {
		throw new Error('Failed to open file? ' + filename);
	}

	content = content.readAllLines();
	if (!content) {
		throw new Error('Data file has no content?' + filename);
	}

	const handle = JSON.parse(content).handle;

	addEventListener("keyup", function KeyEvent(key) {
		if (parseInt(key) === 19) {
			const script = getScript();
			if (!script || me.ingame) return;

			do {
				if (script.name.indexOf(".dbj") === -1) continue;
				if (script.running) {
					print("ÿc1Pausing ÿc0" + script.name);
					script.pause();
				} else {
					print("ÿc2Resuming ÿc0" + script.name);
					script.resume();
				}
			} while (script.getNext());
		}
	});

	const data = JSON.stringify({
		profile: me.profile,
		func: 'heartBeat',
		args: []
	});

	while (true) {
		//print("ÿc1Heart beat " + this.handle);
		sendCopyData(null, handle, 0xbbbb, data);
		delay(1000);
	}
}