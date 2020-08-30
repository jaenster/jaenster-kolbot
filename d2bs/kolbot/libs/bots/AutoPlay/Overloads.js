/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {


	function Overload(Obj, name, fn) {
		console.debug('Overloading ' + Obj.name + '.' + name);
		this.obj = Obj;
		this.name = name;
		this.original = Obj[fn];
		this.fn = fn;

		Obj[fn] = fn.bind(Obj, this.original);
	}

	Overload.prototype.rollback = function () {
		this.obj[this.name] = this.original;
	};

	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {

		const overloads = [
			new Overload(Pather, 'getWP', /**@this Pather*/ function (original, ...args) {

				// If we can teleport we just use the original Pather.getWP
				if (this.useTeleport()) {
					// call original function for now, overload in the future
					original.call(Pather, args);
				}
			}),
		];


		return {
			rollback: () => {
				overloads.forEach(el => el.rollback());
			}
		}

	}


})(module, require);