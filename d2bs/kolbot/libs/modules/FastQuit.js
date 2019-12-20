// /**
//  * @description Simple script that makes quiting a game allot more fast
//  * @author Jaenster
//  */
// (function (global) { // Doesnt have return anything, it injects itself in global scope
// 	!isIncluded('require.js') && include('require.js');
// 	const Message = require('Messaging');
// 	switch (getScript.startAsThread()) {
// 		case 'thread':
// 			let startedInGame = me.inGame;
// 			print('ÿc2Jaensterÿc0 :: Fast quit running');
// 			const Worker = require('Worker');
// 			let quitting = false;
// 			const fastQuit = function () {
// 				if (quitting) return; // Somehow there is recursion
//
// 				quitting = true;
// 				let Default = getScript('default.dbj');
// 				Default && Default.pause(); // pause the default script so quitting game is faster
// 			};
//
// 			Message.on('FastQuit', data => data.hasOwnProperty('act') && data.act && fastQuit());
// 			addEventListener('gamepacketsent', bytes => bytes && bytes.length && bytes[0] === 0x69 && Worker.push(fastQuit) && false); // false to dont block the packet
//
// 			while (true) {
// 				delay(3); // Just idle
// 				if (startedInGame && quitting) break;
// 			}
// 			break;
// 		case 'started':
// 		case 'loaded':
// 	}
// })(this);