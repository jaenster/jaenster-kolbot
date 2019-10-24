/**
 *    @filename    AncientTunnels.js
 *    @author      kolton
 *    @desc        clear Ancient Tunnels
 */

function AncientTunnels(Config, Attack, Pickit, Pather, Town) {
	Town();
	if (!Pather.journeyTo(65)) {
		throw new Error("Failed to move to Ancient Tunnels");
	}

	Attack.clearLevel(Config.ClearType);
	return true;
}