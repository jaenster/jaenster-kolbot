/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {


	function Overload(Obj, name, fn) {
		this.obj = Obj;
		this.name = name;
		this.original = Obj[fn];
		this.fn = fn;
		this.installed = false;


		Overload.instances.push(this);
	}
	// static variable
	Overload.instances = [];

	Overload.prototype.remove = function () {
		if (this.installed) {
			console.debug('removing ' + this.name + '.' + name);
			this.obj[this.name] = this.original;

			this.installed = false;
		}
	};

	Overload.prototype.install = function () {
		if (!this.installed) {
			console.debug('Overloading ' + this.name + '.' + name);
			this.obj[this.name] = this.fn.bind(this.obj, this.original);

			this.installed = true;
		}
	};

	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
		const from = Overload.instances.length;
		new Overload(Pather, 'getWP', /**@this Pather*/ function (original, ...args) {

			// If we can teleport we just use the original Pather.getWP
			if (this.useTeleport()) {
				// call original function for now, overload in the future
				original.call(Pather, args);
			}
		});


		Overload.instances.slice(from).forEach(ol => ol.install());
		return {
			rollback: () => {
				Overload.instances.forEach(el => el.remove());
			}
		}
	};
	module.exports.Overload = Overload;

})(module, require);