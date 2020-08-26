/**
 * @description A tiny lib to deal with D2Bot#'s handle and heartbeat, instead of having rewrite in every starter script the same code
 * @author Jaenster
 */

(function (module, require, thread) {
	const Messaging = require('../modules/Messaging');
	const local = module.exports = {
		handle: 0,
		gameInfo: {},
		crashInfo: {}
	};

	if (thread === 'thread') {
		Messaging.on('Handle', data => data.hasOwnProperty('request') && Messaging.send({Handle: local}));
		include('oog.js') && include('polyfill.js');

		require('../modules/HotKey').on(19, (script = getScript()) => {
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
		const Delta = new (require('../modules/Deltas'));
		const onData = function (mode, msg) {
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
				case mode === 0xf124:
					gameInfo.crashInfo = JSON.parse(msg);
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

	// if its already loaded, we already have the handle. So lets request the data
	if(thread === 'loaded') Messaging.send({Handle: {request: true}});

	Messaging.on('Handle', data => Object.keys(local).filter(x => data.hasOwnProperty(x)).forEach(x => local[x] = data[x]));

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require,getScript.startAsThread());