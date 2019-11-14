/**
 * @author ryancrunchi
 * @description Den of evil.
 */
(function (module,require) {
	const Den = function (Config, Attack, Pickit, Pather, Town) {
		const Promise = require('Promise'),
			TownPrecast = require('TownPrecast'),
			Precast = require('Precast'),
			Rx = require('Observable');

		let promise = new Promise((resolve, reject) => {
			// TODO: clear path at low level
			Pather.journeyTo(sdk.areas.DenOfEvil) && resolve() || reject();
		});

		// just testing Observable module
		Rx.Observable.fromPromise(promise)
			.subscribe(x => {
				// 0xF = skip normal, 0x7 = champions/bosses, 0 = all
				Attack.clearLevel({spectype: 0});
			},
			e => {
				print("error "+e);
			},
			() => {
				print("complete");
			});
	}

	module.exports = Den;
})(typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require );



