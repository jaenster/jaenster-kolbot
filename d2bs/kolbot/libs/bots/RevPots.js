/**
 * @description Search for rev pots
 * @author Jaenster
 */

module.exports = function (Config, Attack, Pickit, Pather, Town, Misc) {
	const GameData = require('../modules/GameData');
	const AreaData = require('../modules/AreaData');
	const Delta = new (require('../modules/Deltas'));
	const Storage = require('../modules/Storage');
	const excluded = [0,sdk.areas.InnerCloister,sdk.areas.OuterCloister, sdk.areas.MatronsDen,sdk.areas.FogottenSands,sdk.areas.FurnaceofPain,sdk.areas.UberTristram, sdk.areas.MaggotLairLvl1, sdk.areas.MaggotLairLvl2, sdk.areas.MaggotLairLvl3, sdk.areas.AncientsWay, sdk.areas.MooMooFarm];

	// First check for in town is when stepping _out_ of town, so make sure we check at start, given we are not in town
	me.inTown && Town();

	this.do = () => !done && AreaData
		.filter(target => excluded.indexOf(target.Index) === -1)
		.map(target => ({area: target, effort: GameData.areaEffort(target.Index)}))
		.sort((a, b) => a.effort - b.effort)
		.map(target => target.area)
		.some(function (area) {
			print('Going to area '+Object.keys(sdk.areas).find(key=>sdk.areas[key]===area.Index));
			Pather.journeyTo(area.Index);
			Attack.clearLevel({spectype: 0xF, quitWhen: () => done});
			return done;
		});

	Object.defineProperty(this, 'revpots', {
		get: () => me.getItemsEx()
			.filter(item => item.classid === 515 || item.classid === 516)
			.filter(item => item.location === sdk.storage.Inventory || item.location === sdk.storage.Belt),
	});
	const wantedPots = Math.floor((Config.BeltColumn.filter(x => x === 'rv').length * Storage.BeltSize() / 2) + .5);
	let done = this.revpots.length >= wantedPots;

	// Do town crap whenever we are in town
	Delta.track(() => me.inTown, () => me.inTown && Town());
	Delta.track(() => this.revpots.length, (o, n) => done |= n <= wantedPots);

	try {
		this.do();
	} finally { // Whatever happens, remove the Delta's
		Delta.destroy(); // Stop towning in town, to be sure
	}
};