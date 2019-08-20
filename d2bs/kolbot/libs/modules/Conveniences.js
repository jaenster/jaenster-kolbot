/**
 * @description Just some stuff, that makes the bot a bit more human like in town
 * @Author Jaenster
 */

(function (module, require) {
	const Promise = require('Promise');
	let healers = [sdk.monsters.Akara, sdk.monsters.Atma, sdk.monsters.Fara, sdk.monsters.Ormus, sdk.monsters.Jamella, sdk.monsters.Malah];

	// (_ => _(_))(
	// 	self => new Promise(resolve => me.inTown && resolve())
	// 		.then(() =>
	// 			new Promise(	// Resolve if we are near a an healer
	// 				(resolve, reject) =>
	// 					// find a healer close by
	// 					(me.inTown && healers.find(id =>
	// 						(unit => unit
	// 								&& unit.distance < 20
	// 								&& resolve(unit)
	// 						)(getUnits(1, id).first())))
	// 					|| (!me.inTown && reject('left town'))
	// 			)
	// 			// once we are near a healer
	// 				.then((unit) =>
	// 					(me.hp * 100 / me.hpmax <= 95 || me.mp * 100 / me.mpmax <= 95)
	// 					&& Packet.openMenu(unit) && me.cancel()
	// 				)
	// 				// We might have left town
	// 				.catch(reason => ({}))
	// 				// we can be in town again
	// 				.finally(() => self(self))
	// 		)
	// )


})(module, require);