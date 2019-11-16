/** @typedef {Unit} me */

(function () {
	const Events = new (require('Events'));
	me.switchWeapons = function (slot) {
		if (this.gametype === 0 || this.weaponswitch === slot && slot !== undefined) {
			return true;
		}

		while(typeof me !== 'object') delay(10);

		let originalSlot = this.weaponswitch;


		let i, tick, switched = false,
			packetHandler = (bytes) => bytes.length > 0 && bytes[0] === 0x97 && (switched = true) && false; // false to not block
		addEventListener('gamepacket', packetHandler);
		try {
			for (i = 0; i < 10; i += 1) {
				print('Switch weapons -- attempt #' + (i + 1));

				for (let j = 10; --j && me.idle;) {
					delay(3);
				}

				i > 0 && delay(Math.min(1 + (me.ping * 1.5), 10));
				!switched && sendPacket(1, 0x60); // Swap weapons

				tick = getTickCount();
				while (getTickCount() - tick < 250 + (me.ping * 5)) {
					if (switched || originalSlot !== me.weaponswitch) {
						return true;
					}

					delay(3);
				}
				// Retry
			}
		} finally {
			removeEventListener('gamepacket', packetHandler);
		}


		return false;
	};

	(function (original) {
		// Put a skill on desired slot
		me.setSkill = function (skillId, hand, item) {
			// Check if the skill is already set
			if (me.getSkill(hand === 0 && 2 || 3) === skillId) return true;

			if (!item && !me.getSkill(skillId, 1)) return false;

			// Charged skills must be cast from right hand
			if (hand === undefined || hand === 3 || item) {
				item && hand !== 0 && print('[ÿc9Warningÿc0] charged skills must be cast from right hand');
				hand = 0;
			}

			return !!original.apply(me, [skillId, hand, item]);
		}
	})(me.setSkill);

	Object.defineProperties(me, {
		primarySlot: {
			get: function () {
				const Config = require('Config');
				return Config.PrimarySlot !== undefined ? Config.PrimarySlot : 0;
			},
			enumerable: false,
		},
		usingBow: {
			get: function () {
				return '';//ToDo; implement
			}
		}
	});

	me.journeyToPreset = function (area, unitType, unitId, offX, offY, clearPath, pop) {
		const Pather = require('Pather');
		if (me.area !== area) Pather.journeyTo(area);

		let presetUnit = getPresetUnit(area, unitType, unitId);
		return presetUnit && presetUnit.moveTo(offX, offY, clearPath, pop);
	};
	me.useWaypoint = function (targetArea) {
		const Pather = require('Pather');
		Pather.useWaypoint(targetArea);
		return this;
	};

	me.on = Events.on;
	me.off = Events.off;
	me.once = Events.once;
	me.trigger = Events.trigger;
})();