/**
 * @author Jaenster
 * @description Simple IRC library that connects to IRC, and not much more as that
 *
 * @config

 	const client = new IRC({
 		server: 'irc.whatever.org',
 	})

 	client.on('msg',function(data) {

 	});

 */
(function (module, require) {
	const defaultSettings = {
		server: undefined,
		nick: me.windowtitle,
		user: 'D2BS',
		port: 6667,
		channel: '#d2bs',
	};
	module.exports = function (config) {
		Object.keys(defaultSettings).filter(key => !config.hasOwnProperty(key)).forEach(key => config[key] = defaultSettings[key]);
		Object.keys(config).forEach(key=>this[key]=config[key]);

		if (!config.server) throw new Error('Need a server to connect to');

		const Events = require('../modules/Events');
		const myEvents = new Events();
		Object.keys(myEvents).forEach(key=>this[key]=myEvents[key]);

		/** @type Socket*/
		const socket = new (require('../modules/Socket'))(config.server,config.port);

		// Override the socket's send function, so it always ends with and crlf
		(orgSend => socket.send = data => data !== undefined && orgSend.call(orgSend, data.toString() + String.fromCharCode(13, 10)))(socket.send);

		// Override the connnect function
		(orgSocket => socket.connect = () => {
			try {
				orgSocket.apply(socket);
				socket.send('NICK '+this.nick);
				socket.send('USER '+this.user+' :A Diablo 2 Bot');
				print('Connected to ' + hostname);
			} catch (e) {
				// Dont care for a failed connection
				print('Failed to connect to ' + hostname + ' (' + e.message + ')');
			}
		})(socket.connect);

		socket.connect();

		socket.on('data', function (data) {
			data.split(String.fromCharCode(13, 10)).forEach(function(line) {
				this.emit(null,line);
				const splitter = line.split(' ');
				const key = line.startsWith(':') ? splitter.length > 1 && splitter[1] : splitter.first();

				switch(key) {
					case 'PING':
						socket.send(line.substr(line.indexOf(key)).replace('PING','PONG')); // reply on a PING msg
						break;
					case '001':
						socket.send('JOIN '+this.channel);
						break;
					case 'PRIVMSG':
						this.emit('msg',line);
						break;
				}
			});
		});

		this.send = socket.send;
	}
}).call(null, module, require);