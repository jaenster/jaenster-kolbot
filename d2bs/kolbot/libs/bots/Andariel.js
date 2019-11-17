/**
*	@filename	Andariel.js
*	@author		jaenster
*	@desc		kill Andariel
*/

module.exports =  function(Config, Attack, Pickit, Pather, Town, Misc) {
	Town();
	if (!Pather.journeyTo(sdk.areas.CatacombsLvl4)) {
		throw Error('Failed to move to Andariel');
	}

	Pather.moveTo(22549, 9520);
	const andy = getUnit(1,sdk.monsters.Andariel); // Andariel

	if (!andy) throw new Error('Andariel not found');

	andy.kill();

	// Wait for minions to die.
	while(getUnits(1).filter(x=>x.attackable).filter(x=>getDistance(andy,x) < 15).length > 3) delay(3);

	Pickit.pickItems();

	return true;
};
