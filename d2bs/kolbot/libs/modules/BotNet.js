/**
 * @description Communication between bots, via sockets. Globally. Development currently
 * @author Jaenster
 *
 */
(function (module, require) {
	require('Debug');
	const myEvents = new (require('Events'));
	const exports = {
		on: myEvents.on,
		off: myEvents.off,
		once: myEvents.once,
		register: channel => Message.send({BotNet: {register: channel}}),
		send: (channel, data) => {
			Message.send({BotNet: {send: {channel: {data: data, name: channel}}}})
		},
	};
	const Message = require('Messaging');

	if (getScript.startAsThread() === 'thread') {
		/** @type Socket */
		const Socket = require('Socket');

		const socket = new Socket('localhost', 0xD2B5);

		// Override the send function, so we can just send data blobs
		(orgSend => socket.send = data => data !== undefined && orgSend.call(orgSend, JSON.stringify(data) + String.fromCharCode(13, 10)))(socket.send);
		// Override the connnect function
		(orgSocket => socket.connect = () => {
			try {
				orgSocket.connect();
			} catch (e) {
				// Dont care for a failed connection
			}
		})(socket.connect);

		socket.connect();

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
				data = JSON.parse(data);
				Message.send({BotNet: {emit: data}})
			} catch (e) {
				// Ignore
			}
		});

		let lastReconnect = getTickCount();
		socket.on('close', function (socket) { // reconnect over 5 seconds
			new Promise(resolve => getTickCount() - lastReconnect > 5e3 && resolve())
				.then(_ => !socket.connected && (lastReconnect = getTickCount()) && socket.connect());
		});


		let mapid = 0;

		while (true) {
			delay(10);

			if (me.hasOwnProperty('mapid') && me.mapid && mapid !== me.mapid && socket.connected) {
				mapid && socket.send({unregister: mapid});
				socket.send({register: (mapid = me.mapid)});
			}

			if (!socket.connected && getTickCount() - lastReconnect > 5e3) {
				// In case its not connected, check the time since the last attempt to reconnect
				lastReconnect = getTickCount();
				socket.connect();
			}
		}

	} else {
		module.exports = exports;
		Message.on('BotNet', function (data) {

			if (data.hasOwnProperty('emit')) {
				// Trigger global events
				myEvents.emit(null, data.emit);

				// Hook specifically on a channel
				if (data.emit.hasOwnProperty('channel') && data.emit.channel.hasOwnProperty('name') && data.emit.channel.hasOwnProperty('data')) {
					// Trigger as channel event
					myEvents.emit(data.emit.channel.name, data.emit.channel.data);
				}
			}
		});
	}


}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);