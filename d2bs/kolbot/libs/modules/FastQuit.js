// /**
//  * @description Simple script that makes quiting a game allot more fast
//  * @author Jaenster
//  */
// (function (global) { // Doesnt have return anything, it injects itself in global scope
// 	let currentFile = 'libs/bots/SpeedBaal.js';
//
// 	if (getScript(currentFile) && getScript(currentFile).name === getScript(true).name) {
// 		let quitting, tick, oldtick, diaReady, oldDiaReady;
// 		quitting = diaReady = oldDiaReady = false;
// 		tick = oldtick = 0;
//
// 		let fastQuit = function () {
// 			if (quitting) return; // Somehow there is recursion
//
// 			quitting = true;
// 			let Default = getScript('default.dbj');
// 			Default && Default.stop();
// 			quit(); // quit the game
// 			print('fast quitting');
// 			getScript(true).stop();
// 		};
//
// 		print('ÿc2FastQuitterÿc0 :: thread loaded');
// 		// Running as a thread
// 		addEventListener('gamepacketsent', bytes => bytes && bytes.length && bytes[0] === 0x69 && fastQuit() && false); // false to dont block the packet
// 		addEventListener('gamepacket', bytes => bytes
// 			&& bytes.length
// 			&& (
// 				(
// 					bytes[0] === 0xA4 // baal laughs
// 					&& (tick = getTickCount())
// 				) || (
// 					bytes[0] === 0x89 // All seals and monsters done
// 					&& (diaReady = true)
// 				)
// 			) && false);
//
// 		addEventListener('scriptmsg', event => event && event.hasOwnProperty('quiting') && fastQuit());
//
// 		// print('here');
// 		while (!quitting) {
// 			delay(1000); // Just idle
// 			if (tick !== oldtick) {
// 				oldtick = tick;
// 				delay(1000); // wait a while thanks to the magic of d2bs
// 				scriptBroadcast({
// 					baaltick: tick,
// 				});
// 			}
// 			if (diaReady !== oldDiaReady) {
// 				oldDiaReady = diaReady;
// 				delay(1000); // wait a while thanks to the magic of d2bs
// 				scriptBroadcast({
// 					diaReady: diaReady,
// 				});
// 			}
// 		}
// 	} else {
// 		typeof global !== 'undefined' && (global.quit = function (reason) {
// 			scriptBroadcast({
// 				quiting: true,
// 				reason: reason, // Should log this or something
// 			});
// 			getScript(true).stop();
// 		});
//
// 		// load the thread, if it isnt loaded yet
// 		getScript(currentFile) || load(currentFile);
// 	}
// })(this);