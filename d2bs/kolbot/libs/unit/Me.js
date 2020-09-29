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
		console.debug('Opening cube?');
		let i, tick,
			cube = me.cube;

		if (!cube) return false;

		if (getUIFlag(0x1a)) return true;

		if (cube.location === 7) {
			const Town = require('../modules/Town');
			if (cube.location === 7 && !Town.openStash()) return false;
		}

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

	// get the item classid from chestid. Usefull for items like inifuss with tree, act 2 staff and amulet with chests etc...
	me.getQuestItem = function (classid, chestid) { // Accepts classid only or a classid/chestid combination.
		const Storage = require('../modules/Storage'),
			Pickit = require('../modules/Pickit'),
			Town = require('../modules/Town'),
			Misc = require('../modules/Misc');

		var i, chest, item,
			tick = getTickCount();

		if (me.findItem(classid)) { // Don't open "chest" or try picking up item if we already have it.
			return true;
		}

		if (me.inTown) {
			return false;
		}

		if (arguments.length > 1) {
			chest = getUnit(2, chestid);
			if (chest) {
				Misc.openChest(chest);
			}
		}

		for (i = 0; i < 50; i += 1) { // Give the quest item plenty of time (up to two seconds) to drop because if it's not detected the function will end.
			item = getUnit(4, classid);
			if (item) {
				break;
			}
			delay(40);
		}

		while (!me.findItem(classid)) { // Try more than once in case someone beats me to it.
			item = getUnit(4, classid);
			if (item) {
				if (Storage.Inventory.CanFit(item)) {
					Pickit.pickItem(item);
					delay(me.ping * 2 + 500);
				} else {
					if (Pickit.canMakeRoom()) {
						console.debug("ÿc1Trying to make room for " + Pickit.itemColor(item) + item.name);
						Town.visitTown(); // Go to Town and do chores. Will throw an error if it fails to return from Town.
					} else {
						console.debug("ÿc1Not enough room for " + Pickit.itemColor(item) + item.name);
						return false;
					}
				}
			} else {
				return false;
			}
		}

		return true;
	};


	// Credits to Jean Max for this function: https://github.com/JeanMax/AutoSmurf/blob/master/AutoSmurf.js#L1346
	me.talkTo = (npc) => {
		const NPC = require('../modules/NPC'),
			Town = require('../modules/Town'),
			Pather = require('../modules/Pather');


		for (var i = 0; i < 5; i++) {
			Town.move(npc === NPC.Jerhyn ? "palace" : npc);
			var monkey = getUnit(sdk.unittype.NPC, npc === NPC.Cain ? "deckard cain" : npc);
			if (monkey && monkey.openMenu()) {
				return monkey;
			}
			//Packet.flash(me.gid);
			delay(me.ping * 2 + 500);
			Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
		}

		return false;
	};

	me.moveTo = function(...args) {
		const Pather = require('../modules/Pather');
		Pather.moveTo.apply(Pather, args)
	};

	me.getCube = () => {
		const Misc = require('../modules/Misc');

		me.journeyToPreset(sdk.areas.HallsOfDeadLvl3, 2, sdk.units.HoradricCubeChest);

		const chest = getUnit(2, sdk.units.HoradricCubeChest);
		if (chest) {
			Misc.openChest(chest);
		}

		const cube = Misc.poll(() => getUnit(4, sdk.items.cube), 3000, 30);
		cube && cube.pick();

		return !!me.getItem(sdk.items.cube);
	};

	// me.openCube = () => {
	// 	while (!getUIFlag(0x1A)) {
	// 		sendPacket(1, 0x27, 4, me.findItem(-1, -1, me.findItems(-1, -1, 3) === false ? 1 : 3).gid, 4, me.getItem("box").gid);
	// 		delay((me.ping || 0) * 2 + 200);
	// 	}
	// };

	me.on = Events.on;
	me.off = Events.off;
	me.once = Events.once;
	me.trigger = Events.trigger;
	me.emit = Events.emit;
})();