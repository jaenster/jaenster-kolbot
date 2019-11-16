/**
 *    @filename    Avoid.js
 *    @author        dzik, jaenster
 *    @desc        test version of missiles avoid
 *  @version    2018.09.16 19:56
 */
(function (module, require) {
	const Worker = require('Worker');
	const Config = require('Config');
	const Pather = require('Pather');
	const dodgeHP = Math.max(Config.LifeChicken * 1.20, Config.TownHP * 1.20); // 20% above life chicken, or town chicken if set
	print('AVOID ON ' + dodgeHP + '%');
	getScript(true).name.toLowerCase() === 'default.dbj' && (Worker.runInBackground.avoid = function () {
		let merc = me.getMerc();
		if (dodgeHP > 0 && me.hp < Math.floor(me.hpmax * dodgeHP / 100)) {
			print('POSSIBLE DODGE');
			print(Worker.recursiveCheck());
			let test = getUnit(3);
			if (test && !(merc && merc.gid === test.owner) && !Worker.recursiveCheck()) {
				print('DODGING');
				do {
					let xoff = me.x - test.targetx;
					let yoff = me.y - test.targety;
					let xdist = me.x - test.x;
					let ydist = me.y - test.y;
					if (xoff < 5 && yoff < 5 && xdist < 15 && ydist < 15) {
						if (xdist < 2 && ydist < 2) {
							xdist = 5;
							ydist = 5;
							print("point attack");
						}
						let find = 1;
						let v = new Vector(xdist, ydist);
						v.rotate(45);
						v.normalize();
						v.mul(20);
						while (!Pather.checkSpot(Math.round(me.x + v.x), Math.round(me.y + v.y), 0x1, false) && find < 360 / 5 * 2) {
							v.rotate(5);
							if (find === 360 / 5) {
								v.normalize();
								v.mul(30)
							}
							find++;
						}
						Pather.moveTo(Math.round(me.x + v.x), Math.round(me.y + v.y));
						me.overhead("DODGE! (" + (45 - 15 + find * 15) + "°)");
					}
				} while (test.getNext())
			}
		}
		return true;
	});


	function Vector(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	Vector.prototype.rotate = function (deg) {
		let rad = deg * (Math.PI / 180);
		let c = Math.cos(rad);
		let s = Math.sin(rad);
		let x = c * this.x - s * this.y;
		let y = s * this.x + c * this.y;
		this.x = x;
		this.y = y;
	};

	Vector.prototype.add = function (b) {
		if (typeof (b) == "number") return new Vector(this.x + b, this.y + b);
		return new Vector(this.x + b.x, this.y + b.y);
	};

	Vector.prototype.sub = function (b) {
		if (typeof (b) == "number") return new Vector(this.x - b, this.y - b);
		return new Vector(this.x - b.x, this.y - b.y);
	};

	Vector.prototype.mul = function (b) {
		if (typeof (b) == "number") {
			return new Vector(this.x * b, this.y * b);
		}
		return new Vector(this.x * b.x, this.y * b.y);
	};

	Vector.prototype.div = function (b) {
		if (typeof (b) == "number") {
			return new Vector(this.x / b, this.y / b);
		}
		return new Vector(this.x / b.x, this.y / b.y);
	};

	Vector.prototype.magnitude = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	};

	Vector.prototype.normalize = function () {
		let m = this.magnitude();
		this.div(m);
	};

	Vector.prototype.perpendicular = function () {
		return new Vector(-this.y, this.x);
	};
})(module, require);