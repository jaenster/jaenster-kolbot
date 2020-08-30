/**
 * @description Files we want to override from kolbot
 */
(function (module, require) {


	function Overload(Obj, name, fn) {
		this.obj = Obj;
		this.name = name;
		this.original = Obj[fn];
		this.fn = fn;

		Obj[fn] = fn.bind(Obj, this.original);
	}

	Overload.prototype.rollback = function() {
		this.obj[this.name] = this.original;
	};

	module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {

		const overloads = [
			new Overload(Pather, 'getWP', function (original, ...args) {

				// call original function for now, overload in the future
				original.call(Pather, args);
			})
		];




		return {
			rollback: () => {
				overloads.forEach(el => el.rollback());
			}
		}

	}


})(module, require);