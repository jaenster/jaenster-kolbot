/**
 * @description a wrapper around the socket object
 * @author Jaenster
 */


(function (module, require, buildinSock) {
	const Worker = require('Worker');
	const Events = require('Events');

	function Socket(hostname, port) {
		typeof Socket.__socketCounter === 'undefined' && (Socket.__socketCounter = 0);

		let buffer;
		Object.defineProperty(this, 'buffer', {
			get: function () {
				return buffer;
			},
			set: function (obj) {
				return buffer += obj && typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
			}
		});


		const myEvents = new Events;

		this.buffer = '';
		this.connect = () => (this.socket = buildinSock.open(hostname, port) && false) || this;

		this.on = myEvents.on;
		this.off = myEvents.off;
		this.once = myEvents.once;

		const close = () => {
			this.socket = null;
			myEvents.emit('close', this);
		};

		this.recv = () => {
			if (this.socket) return;

			const data = (() => {
				try {
					return this.socket.read()
				} catch (e) {
					close();
				}
			})();

			data && myEvents.emit('data', data);
		};

		this.send = (data) => {
			if (!data || !buffer || !this.socket) return;

			try {
				this.socket.send(data || buffer);
			} catch (e) {
				close();
			}
			buffer = '';
		};

		Worker.runInBackground['__socket__' + (++Socket.__socketCounter)] = () => this.recv() || this.send() || true;
		return this;
	}

	module.exports = Socket;
}).call(null, module, require, Socket);