(function (module, require) {
	const BotNet = require('BotNet');
	const Message = require('Messaging');
	const Events = require('Events');

	function Channel(name) {
		const myEvent = new Events;

		Channel.instances.push(this);

		const eventFunc = function (data) {
			// Yeey we actually got some data within the channel
			Object.keys(data.emit.data).forEach(key => this.emit(key, data.emit.data[key]))
		};

		// Tell the system to listen for this channel
		Message.send({BotNet: {register: name}});

		// In case something happens on the channel
		BotNet.on(name, eventFunc);

		this.delete = () => {
			const index = Channel.instances.findIndex(this);
			if (index > -1) Channel.instances.splice(index, 1);
			exports.off(name, eventFunc);
			delete this;
		};

		this.send = data => BotNet.send(me.mapid, data);


		this.on = myEvent.on;
		this.off = myEvent.off;
		this.once = myEvent.once;

		return this;
	}

	Channel.instances = [];

	(function (mapid, channel) {
		Object.defineProperty(Channel, 'inGame', {
			get: function () {
				if (!me.ingame) return null;// not in game, no ingame channel
				if (mapid === me.mapid && channel) return channel; // return the cached channel
				if ((mapid = me.mapid)) return channel = new Channel(me.mapid) // In case the new map id isnt 0
			}
		});
	}).call(me.mapid);


	return Channel;

}).call(null, module, require);