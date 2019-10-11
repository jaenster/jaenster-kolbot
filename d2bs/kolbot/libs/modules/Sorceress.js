/**
 * @description Some sorc specific's
 * @Author Jaenster
 */
(function (module, require) {

	// Override the interact function, to use telekinesis when possible
	(function (interact) {
		Unit.prototype.interact = function (...args) {
			// Dont use on anything else as objects, or if any argument given
			if (this.type !== sdk.unittype.Objects || args.length || !me.getSkill(sdk.skills.Telekinesis, 1)) return interact.apply(this, args);

			this.cast(sdk.skills.Telekinesis, undefined, undefined, undefined, undefined, true);
		}
	})(Unit.prototype.interact);


	(function (click) {
		Misc.click = function (...args) {
			let [button, shift, unit] = args;
			switch (true) { // A big list of exclusions
				case !me.getSkill(sdk.skills.Telekinesis, 1):
				case typeof unit !== 'object':
				case unit.type !== sdk.unittype.Objects:
				case unit.name === 'portal' && !me.inTown: // cant use telekenis on portals
				case[sdk.units.RedPortalToChamber, sdk.units.RedPortal, sdk.units.RedPortalToAct5].indexOf(unit.classid):
					return click.apply(Misc, args)
			}
			return unit.cast(sdk.skills.Telekinesis, undefined, undefined, undefined, undefined, true);
		}
	})(Misc.click)

})(module, require);