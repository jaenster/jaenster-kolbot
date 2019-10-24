/**
 * @description Simple script that makes quiting a game allot more fast
 * @author Jaenster
 */
(function (global) { // Doesnt have return anything, it injects itself in global scope
	!isIncluded('require.js') && include('require.js');
	const Message = require('Messaging');
	switch (getScript.startAsThread()) {
		case 'thread':
			print('ÿc2Jaensterÿc0 :: Fast quit running');
			const Worker = require('Worker');
			let quitting = false;
			const fastQuit = function () {
				if (quitting) return; // Somehow there is recursion

				quitting = true;
				let Default = getScript('default.dbj');
				Default && Default.stop();
				quit(); // quit the game
				print('fast quitting');
				getScript(true).stop();
			};

			Message.on('FastQuit', data => data.hasOwnProperty('act') && data.act && fastQuit());
			addEventListener('gamepacketsent', bytes => bytes && bytes.length && bytes[0] === 0x69 && Worker.push(fastQuit) && false); // false to dont block the packet

			while (!quitting) {
				delay(3); // Just idle
			}
			break;
		case 'started':
		case 'loaded':
			typeof global !== 'undefined' && (global.quit = function (reason) {
				Message.send({FastQuit: {act: true, reason: reason}});
				getScript(true).stop();
			});
	}
})(this);