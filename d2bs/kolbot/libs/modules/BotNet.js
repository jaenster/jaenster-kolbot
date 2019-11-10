/**
 * @description Communication between bots, via sockets. Globally. Development currently
 * @author Jaenster
 *
 */
(function (module, require) {

	const Message = require('Messaging');
	if (getScript.startAsThread() === 'thread') {
		const Socket = require('Socket');

		const socket = new Socket('localhost', 0xD2B5);
		socket.connect();

		// Override the send function, so we can just send data blobs
		((orgSend, fakeObj) => socket.send = data => {
			fakeObj = JSON.stringify(data);
			orgSend.call(orgSend, fakeObj);
		})(socket.send);

		require('debug');
		// Respond on message's from other threads
		Message.on('BotNet', function (data) {
			if (data.hasOwnProperty('register') && typeof data.register === 'string') socket.send({register: data.register});
			print(' Data? ');
			print(JSON.stringify(data));
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
		require('Debug');
		const myEvents = new (require('Events'));
		module.exports = {
			on: myEvents.on,
			off: myEvents.off,
			register: channel => Message.send({BotNet: {register: channel}}),
			send: (channel, data) => {
				print(channel);
				print(data);
				Message.send({BotNet: {send: {channel: {data: data, name: channel}}}})
			}
		};

		Message.on('BotNet', data => data.hasOwnProperty('emit') && Array.isArray(data.emit) && myEvents.emit.apply(myEvents, data.emit));
	}


}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);