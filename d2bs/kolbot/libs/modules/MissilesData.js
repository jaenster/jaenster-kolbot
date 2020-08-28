(function (module, require) {
	/**
	 *  MissilesData
	 */
	const MISSILES_COUNT = 385;

	var MissilesData = Array(MISSILES_COUNT);

	for (let i = 0; i < MissilesData.length; i++) {
		let index = i;
		MissilesData[i] = ({
			Index: index,
			ClassID: index,
			InternalName: getBaseStat('missiles', index, 'Missile'),
			Velocity: getBaseStat('missiles', index, 'Vel'),
			VelocityMax: getBaseStat('missiles', index, 'MaxVel'),
			Acceleration: getBaseStat('missiles', index, 'Accel'),
			Range: getBaseStat('missiles', index, 'Range'),
			Size: getBaseStat('missiles', index, 'Size'),
		});
	}
	module.exports = MissilesData;
})(module, require);
