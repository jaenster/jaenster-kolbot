/**
 * @description Some sorc specific's
 * @Author Jaenster
 */
(function (module, require) {

	// Override the interact function, to use telekinesis when possible
	(function (interact) {
		Unit.prototype.interact = function (...args) {
			// Dont use on anything else as objects, or if any argument given
			if (this.type !== sdk.unittype.Objects || args.length) interact.apply(this, args);

			print('CAST TELEKENIS INSTEAD OF USING AN OBJECT -- ' + this.name + ' -- ' + this.classid);
			this.cast(sdk.skills.Telekinesis, undefined, undefined, undefined, undefined, true);
		}
	})(Unit.prototype.interact);


	(function (click) {
		Misc.click = function (...args) {
			let [button, shift, unit] = args;
			print('HERE --> ' + unit.name);
			switch (true) { // A big list of exclusions
				case typeof unit !== 'object':
				case unit.type !== sdk.unittype.Objects:
				case unit.name === 'portal' && !me.inTown: // cant use telekenis on portals
					return click.apply(Misc, args)
			}

			print('CAST TELEKENIS INSTEAD OF USING AN OBJECT -- ' + unit.name + ' -- ' + unit.classid);
			return unit.cast(sdk.skills.Telekinesis, undefined, undefined, undefined, undefined, true);
		}
	})(Misc.click)

})(module, require);