(function (module, require) {
	const blizzard = module.exports = {
		name: 'blizzard',
		skills: [
			// sdk.skills we do right away
			[sdk.skills.Teleport, 1],
			[sdk.skills.Warmth, 1],
			[sdk.skills.FrozenArmor, 1],

			[sdk.skills.Blizzard, 20],
			[sdk.skills.IceBlast, 20],
			[sdk.skills.GlacialSpike, 20],
			[sdk.skills.ColdMastery, 1],

			[sdk.skills.FireBall, 20],
			[sdk.skills.IceBolt, 20],
		],
		stats: {
			strength: [156, 1],
			dexterity: [0, 0],
			vitality: [900, 2], // everything else
			energy: [50, 3],
		},
		respec_old: { // Respec once lvl 24
			time: function () {
				// Never active at nm or higher
				return false; // never upgrade this build
			},
			to: 'blizzard',
			at: 1 // 0=normal / 1=nightmare / 2=hell
		},
		respec: {
			want: function () {
				// if blizzard isnt active, and we are lvl 24 aka leveling in normal`
				return !blizzard.active() && me.charlvl >= 24 && me.charlvl < 43;
			},
			diff: 0, // respec at normal

		},

		valid: function () { // can exclude some builds more easily this way
			return me.charlvl >= 24;
		},

		// Function to see if this is the build we currently have
		active: function () {
			return !me.getSkill(sdk.skills.Nova, 0) // if we dont have nova
				&& !me.getSkill(sdk.skills.ChargedBolt, 0) // dont ahve charge bolt
				&& me.getSkill(sdk.skills.FrostNova, 0) // do have frost nova
				&& me.getSkill(sdk.skills.Blizzard, 0); // and we do have blizzard
		},
	};
})(module, require);