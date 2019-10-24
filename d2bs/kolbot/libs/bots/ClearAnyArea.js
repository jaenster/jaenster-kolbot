/**
*	@filename	ClearAnyArea.js
*	@author		kolton
*	@desc		Clears any area
*/

function ClearAnyArea(Config, Attack, Pickit, Pather, Town) {
	Town();

	for (let i = 0; i < Config.ClearAnyArea.AreaList.length; i += 1) {
		if (Pather.journeyTo(Config.ClearAnyArea.AreaList[i])) {
			Attack.clearLevel(Config.ClearType);
		}
	}

	return true;
}