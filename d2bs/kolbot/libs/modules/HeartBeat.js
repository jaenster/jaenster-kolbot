/**
 * @description A tiny lib to deal with D2Bot#'s handle and heartbeat, instead of having rewrite in every starter script the same code
 * @author Jaenster
 */

(function (module, require) {
	const Messaging = require('Messaging');
	require('debug');
	const local = module.exports = {
		handle: 0,
		gameInfo: {}
	};

	if (getScript.startAsThread() === 'thread') {
		Messaging.on('Handle', data => data.hasOwnProperty('request') && Messaging.send({Handle: local}));
		include('oog.js') && include('common/misc.js') && include('common/prototypes.js') && include('polyfill.js');

		require('HotKey').on(19, (script = getScript()) => {
			if (script && !me.ingame) do {
				if (script.name.indexOf(".dbj") === -1) continue;
				if (script.running) {
					print("ÿc1Pausing ÿc0" + script.name);
					script.pause();
					continue;
				}
				print("ÿc2Resuming ÿc0" + script.name);
				script.resume();
			} while (script.getNext());
		});
		const Delta = new (require('Deltas'));
		const onData = function (mode, msg) {
			//print(JSON.stringify({mode: mode, msg: msg}));
			switch (true) {
				case msg === "Handle" && !local.handle:
					local.handle = mode;
					DataFile.updateStats("handle", D2Bot.handle = local.handle);
					D2Bot.requestGameInfo();
					break;
				case mode === 2:
					local.gameInfo = JSON.parse(msg);
					break;
				case mode === 4:
					msg === "pingreq" && sendCopyData(null, me.windowtitle, 4, "pingrep");
					break;
			}
		};

		Delta.track(() => md5(JSON.stringify(local)), () => Messaging.send({Handle: local}));
		addEventListener('copydata', onData);

		const sendData = JSON.stringify({profile: me.profile, func: 'heartBeat', args: []});

		while (true) {
			local.handle && sendCopyData(null, local.handle, 0xbbbb, sendData);
			delay(1000);
		}
	}

	Messaging.on('Handle', data => Object.keys(local).filter(x => data.hasOwnProperty(x)).forEach(x => local[x] = data[x]));

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);