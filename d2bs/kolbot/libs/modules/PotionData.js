/**
 * @description Data about pots
 * @author ryancrunchi
 */
(function (module, require) {
	module.exports = {
		587: { // minorhealingpotion
			type: 'hp',
			effect: [45, 30, 30, 45, 60, 30, 45],
			cost: 30,
			duration: 7.68
		},
		588: { // lighthealingpotion
			type: 'hp',
			effect: [90, 60, 60, 90, 120, 60, 90],
			cost: 67,
			duration: 6.4
		},
		589: { // healingpotion
			type: 'hp',
			effect: [150, 100, 100, 150, 200, 100, 150],
			cost: 112,
			duration: 6.84
		},
		590: { // greaterhealingpotion
			type: 'hp',
			effect: [270, 180, 180, 270, 360, 180, 270],
			cost: 225,
			duration: 7.68
		},
		591: { // superhealingpotion
			type: 'hp',
			effect: [480, 320, 320, 480, 640, 320, 480],
			cost: undefined,
			duration: 10.24
		},
		592: { // minormanapotion
			type: 'mp',
			effect: [30, 40, 40, 30, 20, 40, 30],
			cost: 60,
			duration: 5.12
		},
		593: { // lightmanapotion
			type: 'mp',
			effect: [60, 80, 80, 60, 40, 80, 60],
			cost: 135,
			duration: 5.12
		},
		594: { // manapotion
			type: 'mp',
			effect: [120, 160, 160, 120, 80, 160, 120],
			cost: 270,
			duration: 5.12
		},
		595: { // greatermanapotion
			type: 'mp',
			effect: [225, 300, 300, 225, 150, 300, 225],
			cost: 450,
			duration: 5.12
		},
		596: { // supermanapotion
			type: 'mp',
			effect: [375, 500, 500, 375, 250, 500, 375],
			cost: undefined,
			duration: 5.12
		},
		515: { // normal rv
			type: 'rv',
			effect: [35, 35, 35, 35, 35, 35, 35],
			cost: undefined,
			duration: 0.04, // instant refill (1 frame time)
			recipe: [
				[
					589, 589, 589,
					594, 594, 594,
					item => item.itemType === 91 /*chipped gem*/
				]
			]
		},
		516: { // full rv
			type: 'rv',
			effect: [100, 100, 100, 100, 100, 100, 100],
			cost: undefined,
			duration: 0.04, // instant refill (1 frame time)
			recipe: [ // Not doing anything with this, but. We can in the future
				// Recipe is either an classid, or an function that returns true on the correct item
				[
					515, 515, 515 // 3 normal rv's
				],
				[	// 3 normal hp pots & 3 normal mp pots & a gem
					589, 589, 589,
					594, 594, 594,
					item => item.itemType === 93 /*std gem*/
				],
			]
		},
		getMpPots: function () {
			return this.getPots().filter(el => el.type === 'mp');
		},
		getHpPots: function () {
			return this.getPots().filter(el => el.type === 'hp');
		},

		/** @private */
		getPots: function () {
			return Object.keys(this).filter(key => typeof this[key] === 'object' && this[key]).map(key => this[key]);
		}
	};
})(module, require);