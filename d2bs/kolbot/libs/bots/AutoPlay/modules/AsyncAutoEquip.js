getScript(true).name === 'default.dbj' && (function (module, require) {


	const Worker = require('../../../modules/Worker');
	const Pickit = require('../../../modules/Pickit');


	Worker.runInBackground.AsyncEquipment = function () {

		if (!me.inTown) {

			// If no monster is near
			getUnits(1).filter(unit=>unit.attackable && unit.distance < 20 && !checkCollision(me, unit, 0x1)).length === 0
			// run AutoEquipment stuff
			&& (me.getItems() || []).forEach(item => {
				if (item.location === sdk.storage.Inventory) {
					const result = Pickit.checkItem(item);
					if (typeof result['hook'] !== 'undefined' && result.hook.id === 'AutoEquip') {
						result.hook.handle(item);
					}
				}
			});
		}

		return true;
	}


})(module, require);