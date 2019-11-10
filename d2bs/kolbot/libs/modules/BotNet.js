/**
 * @description Communication between bots, via sockets. Globally. Development currently
 * @author Jaenster
 *
 */
(function (module, require) {
	require('Debug');

	const Events = require('Events');
	const globalEvents = new Events;
	const inGameEvents = new Events;
	const exports = {
		on: globalEvents.on,
		off: globalEvents.off,
		once: globalEvents.once,
		register: channel => Message.send({BotNet: {register: channel}}),
		send: (channel, data) => {
			Message.send({BotNet: {send: {channel: {data: data, name: channel}}}})
		},
		inGame: {
			send: data => exports.send(me.mapid, data),
			on: inGameEvents.on,
			off: inGameEvents.off,
			once: inGameEvents.once,
		},
	};
	const Message = require('Messaging');

	if (getScript.startAsThread() === 'thread') {
		const Socket = require('Socket');

		const socket = new Socket('localhost', 0xD2B5);
		socket.connect();

		// Override the send function, so we can just send data blobs
		((orgSend, fakeObj) => socket.send = data => {
			if (data === undefined) return;
			fakeObj = JSON.stringify(data)+String.fromCharCode(10,13);
			orgSend.call(orgSend, fakeObj);
		})(socket.send);

		require('debug');
		// Respond on message's from other threads
		Message.on('BotNet', function (data) {
			if (data.hasOwnProperty('register') && typeof data.register === 'string') socket.send({register: data.register});
			if (data.hasOwnProperty('send') && typeof data.send === 'object' && data.send) {
				socket.send(data.send)
			}
		});

		socket.on('data', function (data) {
			try {
				data = JSON.stringify(data);
				Message.send({BotNet: {emit: data}})
			} catch (e) {
				// Ignore
			}
		});


		let mapid = 0;

		while (true) {
			delay(10);
			if (me.hasOwnProperty('mapid') && me.mapid && mapid !== me.mapid) {
				mapid && socket.send({unregister: mapid});
				socket.send({register: (mapid = me.mapid)});
			}
		}

	} else {
		module.exports = exports;
		Message.on('BotNet', function (data) {

			// Trigger global events
			globalEvents.emit(null, data.emit);

			// Hook specifically on a channel
			if (data.hasOwnProperty('emit') && data.emit.hasOwnProperty('channel') && data.emit.hasOwnProperty('data')) {
				// Trigger as channel event
				globalEvents.emit(data.channel, data.emit.data);

				// Trigger upon a key, for ingame events, like Team and Messaging (so BotNet.inGame.on('Baal',data => {}));
				me.mapid === data.emit.channel && Object.keys(data.emit.data).forEach(key => inGameEvents.emit(key, data.emit.data[key]));
			}
		});
	}


}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);