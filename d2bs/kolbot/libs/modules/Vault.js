/**
 * @description A vault of data, to be shared with the entire team
 * @author jaenster
 */

(function (module, require) {
	const Team = require('Team');
	const IN_GAME = 1;
	const EVERYONE = 2;
	const Worker = require('Worker');

	const Events = require('Events');
	const Vaults = {};
	const Vault = module.exports = function Vault(name, type = IN_GAME) {
		if (this.__proto__.constructor !== Vault) throw new Error(this.name + " must be called with 'new' operator");

		const myEvents = new Events;
		Object.keys(myEvents).forEach(key => this[key] = myEvents[key]);

		let inEvent = 0;
		const proxifier = target => {
			const data = {};
			return new Proxy(target, {
				get: function (target, key) {
					// Standard stuff
					if (target.hasOwnProperty(key)) return target[key];
					if (key === '__is_vault') return true;
					if (key === 'valueOf' || key === '__vault') return target;
					if (key === '__data') return data;

					if (data.hasOwnProperty(key)) return data[key];

					return null;
				},
				set: function set(target, key, value, receiver, recursion = false) {
					if (target.hasOwnProperty(key)) return false; // dont support setting on target
					try {
						if (typeof value !== 'object' && value) {
							if (data.hasOwnProperty(key) && data[key] !== value) {
								return data[key] = value;
							}
							return true; // already set
						}

						// its an object!
						if (!data.hasOwnProperty(key)) {
							return data[key] = proxifier(data[key]); // data isnt set yet
						}
						Object.keys(data[key].__data).forEach(prop => set(data[key].__data, prop, data[key][prop], receiver, true));
					} finally {
						if (!recursion) {
							const sendData = {};
							sendData['Vault' + name.capitalize()] = {};
							sendData['Vault' + name.capitalize()][key] = value;
							!inEvent && Worker.push(() => Team[type === IN_GAME ? 'broadcastInGame' : 'broadcast'].apply(Team, [sendData]));
							Worker.push(() => myEvents.emit(key, proxy));
						}
					}
					return true; // in case we didn't
				},
			});
		};
		const proxy = proxifier(this);

		Team.on('Vault' + name.capitalize(), data => {
			inEvent++;
			Object.keys(data).forEach(key => proxy[key] = data[key]);
			inEvent--;
		});

		Team[type === IN_GAME ? 'broadcastInGame' : 'broadcast'].apply(Team, [{Vault: {request: name}}]);

		Vaults[name] = this;
		return proxy;
	};
	Vault.IN_GAME = IN_GAME;
	Vault.EVERYONE = EVERYONE;

	Team.on('Vault', obj => obj.hasOwnProperty('request') && obj)
})(module, require);

(function (module, require) {
	module.exports = {};

})(module, require);