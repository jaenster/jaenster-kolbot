/**
 * @description A globally wide channel you can communicate with botters all over the world
 * @author Jaenster
 */

(function (module, require) {
	const BotNet = require('BotNet');
	const Message = require('Messaging');
	const Events = require('Events');
	/** @constructor Channel */
	function Channel(name) {
		const myEvent = new Events;

		Channel.instances.push(this);

		const onEvent = function (data) {
			// Yeey we actually got some data within the channel
			Object.keys(data.emit.data).forEach(key => this.emit(key, data.emit.data[key]));
			this.emit(null,data);
		};

		// Tell the system to listen for this channel
		Message.send({BotNet: {register: name}});

		// In case something happens on the channel
		BotNet.on(name, onEvent);

		this.delete = () => {
			const index = Channel.instances.findIndex(this);
			if (index > -1) Channel.instances.splice(index, 1);
			exports.off(name, onEvent);
			delete this;
		};

		this.send = data => BotNet.send(me.mapid, data);


		this.on = myEvent.on;
		this.off = myEvent.off;
		this.once = myEvent.once;

		return this;
	}

	Channel.instances = [];

	(function (mapid) {
		let channel;
		Object.defineProperty(Channel, 'inGame', {
			get: function () {
				if (!me.ingame) return null;// not in game, no ingame channel

				// return the cached it ?channel
				if (mapid === me.mapid && channel) {
					return channel;
				}

				if ((mapid = me.mapid)) return channel = new Channel(me.mapid) // In case the new map id isnt 0
			}
		});
	}).call(null,me.mapid);


	return Channel;

}).call(null, module, require);