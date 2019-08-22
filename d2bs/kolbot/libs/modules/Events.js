(function (module, require) {
	const Events = module.exports = function () {
		const Worker = require('Worker');
		let self = this;
		this.hooks = [];

		function Hook(name, callback) {
			this.name = name;
			this.callback = callback;
			this.id = self.hooks.push(this);
			this.__callback = callback; // used for once
		}

		this.on = function (name, callback) {
			return new Hook(name, callback);
		};

		this.trigger = function (name, ...args) {
			return self.hooks.forEach(hook => !hook.name || hook.name === name && Worker.push(() => hook.callback.apply(hook, args)));
		};

		this.once = function (name, callback) {
			const Hook = new Hook(name, function (...args) {
				callback.apply(undefined, args);
				delete self.hooks[this.id];
			});
			Hook.__callback = callback;
		};

		this.off = function (name, callback) {
			self.hooks.filter(hook => hook.__callback === callback).forEach(hook => {
				delete self.hooks[hook.id];
			})
		}
	};
})(module, require);