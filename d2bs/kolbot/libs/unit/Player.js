

Object.defineProperty(Unit.prototype, "gold", {
	get: function () {
		return this.getStat(14) + this.getStat(15);
	},
	enumerable: true
});



// Death check
Object.defineProperty(Unit.prototype, "dead", {
	get: function () {
		switch (this.type) {
			case 0: // Player
				return this.mode === 0 || this.mode === 17;
			case 1: // Monster
				return this.mode === 0 || this.mode === 12;
			default:
				return false;
		}
	},
	enumerable: true
});


// Check if unit is in town
Object.defineProperty(Unit.prototype, "inTown", {
	get: function () {
		if (this.type > 0) {
			throw new Error("Unit.inTown: Must be used with player units.");
		}

		return [1, 40, 75, 103, 109].indexOf(this.area) > -1;
	},
	enumerable: true
});


// Check if party unit is in town
Object.defineProperty(Party.prototype, "inTown", {
	get: function () {
		return [1, 40, 75, 103, 109].indexOf(this.area) > -1;
	},
	enumerable: true
});
