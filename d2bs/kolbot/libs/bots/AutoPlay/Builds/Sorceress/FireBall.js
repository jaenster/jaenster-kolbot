(function () {

	const used = true;
	module.exports = {
		name: 'fireball',
		skills: [
			// First skills that are needed
			[sdk.skills.FireBolt, 3], // first 3 points in firebolt
			[sdk.skills.StaticField, 3], // All left over points in static field
			[sdk.skills.Telekinesis, 1],
			[sdk.skills.Warmth, 1],

			[sdk.skills.Teleport, 1],
			[sdk.skills.FireBall, 20],
			[sdk.skills.Teleport, 20],
			[sdk.skills.FireBolt, 20],

		],
		stats: {
			strength: [35, 1],
			dexterity: [0, 0],
			vitality: [200, 3],
			energy: [100, 1],
		},
		valid: function () {
			return me.diff === 0;
		},
		// Function to see if this is the build we currently have
		active: function () {
			return me.diff === 0 && used;
			if (me.getSkill(sdk.skills.Blizzard, 0)) return false;

			// If we have Charged bolt skilled, and not LightingMastery. This build is active
			return me.getSkill(sdk.skills.FireBolt, 1) || (me.getSkill(sdk.skills.ChargedBolt, 1) && !me.getSkill(sdk.skills.LightningMastery, 1));
		},
	};
})();