/** @typedef {Unit} me */

(function () {
	const Events = new (require('../modules/Events'));
	me.switchWeapons = function (slot) {
		if (this.gametype === 0 || this.weaponswitch === slot && slot !== undefined) {
			return true;
		}

		while (typeof me !== 'object') delay(10);

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
				const Config = require('../modules/Config');
				return Config.PrimarySlot !== undefined ? Config.PrimarySlot : 0;
			},
			enumerable: false,
		},
		usingBow: {
			get: function () {
				return '';//ToDo; implement
			}
		},
		cube: {
			get: function () {
				return me.getItem(sdk.items.cube);
			}
		},
		staminaDPS: { // stamina drain per second
			get: function () {
				var bonusReduction = me.getStat(28);
				var armorMalusReduction = 0; // TODO:
				return 25 * Math.max(40 * (1 + armorMalusReduction / 10) * (100 - bonusReduction) / 100, 1) / 256;
			}
		},
		staminaTimeLeft: { // seconds before I run out of stamina (assuming we are running)
			get: function () {
				return me.stamina / me.staminaDPS;
			}
		},
		staminaMaxDuration: { // seconds before I run out of stamina when at max (assuming we are running)
			get: function () {
				return me.staminamax / me.staminaDPS;
			}
		},
		highestAct: {
			get: function () {
				let i = 1, acts = [sdk.quests.AbleToGotoActII,
					sdk.quests.AbleToGotoActIII,
					sdk.quests.AbleToGotoActIV,
					sdk.quests.AbleToGotoActV,
				];

				while (acts.length && me.getQuest(acts.shift(), 0)) {
					i++;
				}
				return i;

			}
		},
		highestQuestDone: {
			get: function () {
				for (var i = sdk.quests.SecretCowLevel; i >= sdk.quests.SpokeToWarriv; i--) {
					if (me.getQuest(i, 0)) {
						return i;
					}
				}
				return undefined;
			}
		}
	});

	me.journeyToPreset = function (area, unitType, unitId, offX, offY, clearPath, pop) {
		const Pather = require('../modules/Pather');
		if (me.area !== area) Pather.journeyTo(area);

		return Pather.moveToPreset(area, unitType, unitId, offX, offY, clearPath, pop);
	};
	me.useWaypoint = function (targetArea) {
		const Pather = require('../modules/Pather');
		Pather.useWaypoint(targetArea);
		return this;
	};

	me.emptyCube = function () {
		const Storage = require('../modules/Storage');
		const cube = me.cube,
			items = me.getItemsEx().filter(item => item.location === sdk.storage.Cube);

		if (!cube) return false;

		if (!items.length) return true;

		return !items.some(item => !(Storage.Stash.MoveTo(item) && Storage.Inventory.MoveTo(item)));
	};

	me.openCube = function () {
		let i, tick,
			cube = me.cube;

		if (!cube) return false;

		if (getUIFlag(0x1a)) return true;

		const Town = require('../modules/Town');
		if (cube.location === 7 && !Town.openStash()) return false;

		for (i = 0; i < 3; i += 1) {
			cube.interact();
			tick = getTickCount();

			while (getTickCount() - tick < 5000) {
				if (getUIFlag(0x1a)) {
					delay(100 + me.ping * 2); // allow UI to initialize

					return true;
				}

				delay(100);
			}
		}

		return false;
	};

	me.closeCube = function () {
		let i, tick;

		if (!getUIFlag(0x1a)) return true;

		for (i = 0; i < 5; i++) {
			me.cancel();
			tick = getTickCount();

			while (getTickCount() - tick < 3000) {
				if (!getUIFlag(0x1a)) {
					delay(250 + me.ping * 2); // allow UI to initialize
					return true;
				}

				delay(100);
			}
		}
		return false;
	};


	me.findItem = function (id, mode, loc, quality) {
		if (id === undefined) {
			id = -1;
		}

		if (mode === undefined) {
			mode = -1;
		}

		if (loc === undefined) {
			loc = -1;
		}

		if (quality === undefined) {
			quality = -1;
		}

		var item = me.getItem(id, mode);

		if (item) {
			do {
				if ((loc === -1 || item.location === loc) && (quality === -1 || item.quality === quality)) {
					return item;
				}
			} while (item.getNext());
		}

		return false;
	};

	me.findItems = function (id, mode, loc) {
		if (id === undefined) {
			id = -1;
		}

		if (mode === undefined) {
			mode = -1;
		}

		if (loc === undefined) {
			loc = false;
		}

		var list = [],
			item = me.getItem(id, mode);

		if (!item) {
			return false;
		}

		do {
			if (loc) {
				if (item.location === loc) {
					list.push(copyUnit(item));
				}
			} else {
				list.push(copyUnit(item));
			}
		} while (item.getNext());

		return list;
	};

	// Credits to Jean Max for this function: https://github.com/JeanMax/AutoSmurf/blob/master/AutoSmurf.js#L1346
	me.talkTo = function (name) {
		const Pather = require('../modules/Pather'),
			Town = require('../modules/Town');

		!me.inTown && Town.goToTown();

		for (let i = 5, npc; i; i -= 1) {
			Town.move(name === "jerhyn" ? "palace" : name);
			npc = getUnit(1, name === "cain" ? "deckard cain" : name);

			if (npc && npc.openMenu()) {
				me.cancel();
				return true;
			}

			delay(me.ping * 2 + 500);
			Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
		}

		return false;
	};

	me.on = Events.on;
	me.off = Events.off;
	me.once = Events.once;
	me.trigger = Events.trigger;
	me.emit = Events.emit;
})();