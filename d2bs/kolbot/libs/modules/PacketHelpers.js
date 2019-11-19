(function (module, require) {
	const Pather = require('Pather');
	const Packet = module.exports = {
		openMenu: function (unit) {
			if (unit.type !== 1) {
				throw new Error("openMenu: Must be used on NPCs.");
			}

			if (getUIFlag(0x08)) {
				return true;
			}

			var i, tick;

			for (i = 0; i < 5; i += 1) {
				if (getDistance(me, unit) > 4) {
					Pather.moveToUnit(unit);
				}

				sendPacket(1, 0x13, 4, 1, 4, unit.gid);
				tick = getTickCount();

				while (getTickCount() - tick < 5000) {
					if (getUIFlag(0x08)) {
						delay(Math.max(500, me.ping * 2));

						return true;
					}

					if (getInteractedNPC() && getTickCount() - tick > 1000) {
						me.cancel();
					}

					delay(100);
				}

				sendPacket(1, 0x2f, 4, 1, 4, unit.gid);
				delay(me.ping * 2);
				sendPacket(1, 0x30, 4, 1, 4, unit.gid);
				delay(me.ping * 2);
				this.flash(me.gid);
			}

			return false;
		},

		startTrade: function (unit, mode) {
			if (unit.type !== 1) {
				throw new Error("Unit.startTrade: Must be used on NPCs.");
			}

			if (getUIFlag(0x0C)) {
				return true;
			}

			var i,
				gamble = mode === "Gamble";

			if (this.openMenu(unit)) {
				for (i = 0; i < 10; i += 1) {
					delay(200);

					if (i % 2 === 0) {
						sendPacket(1, 0x38, 4, gamble ? 2 : 1, 4, unit.gid, 4, 0);
					}

					if (unit.itemcount > 0) {
						delay(200);

						return true;
					}
				}
			}

			return false;
		},

		buyItem: function (unit, shiftBuy, gamble) {
			var i, tick,
				oldGold = me.getStat(14) + me.getStat(15),
				itemCount = me.itemcount,
				npc = getInteractedNPC();

			if (!npc) {
				throw new Error("buyItem: No NPC menu open.");
			}

			if (me.getStat(14) + me.getStat(15) < unit.getItemCost(0)) { // Can we afford the item?
				return false;
			}

			for (i = 0; i < 3; i += 1) {
				sendPacket(1, 0x32, 4, npc.gid, 4, unit.gid, 4, shiftBuy ? 0x80000000 : gamble ? 0x2 : 0x0, 4, 0);

				tick = getTickCount();

				while (getTickCount() - tick < Math.max(2000, me.ping * 2 + 500)) {
					if (shiftBuy && me.getStat(14) + me.getStat(15) < oldGold) {
						return true;
					}

					if (itemCount !== me.itemcount) {
						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		sellItem: function (unit) {
			if (unit.type !== 4) { // Check if it's an item we want to buy
				throw new Error("Unit.sell: Must be used on items.");
			}

			var i, tick, npc,
				itemCount = me.itemcount;

			npc = getInteractedNPC();

			if (!npc) {
				return false;
			}

			for (i = 0; i < 5; i += 1) {
				sendPacket(1, 0x33, 4, npc.gid, 4, unit.gid, 4, 0, 4, 0);

				tick = getTickCount();

				while (getTickCount() - tick < 2000) {
					if (me.itemcount !== itemCount) {
						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		identifyItem: function (unit, tome) {
			var i, tick;

			if (!unit || unit.getFlag(0x10)) {
				return false;
			}

			CursorLoop:
				for (i = 0; i < 3; i += 1) {
					sendPacket(1, 0x27, 4, unit.gid, 4, tome.gid);

					tick = getTickCount();

					while (getTickCount() - tick < 2000) {
						if (getCursorType() === 6) {
							break CursorLoop;
						}

						delay(10);
					}
				}

			if (getCursorType() !== 6) {
				return false;
			}

			for (i = 0; i < 3; i += 1) {
				if (getCursorType() === 6) {
					sendPacket(1, 0x27, 4, unit.gid, 4, tome.gid);
				}

				tick = getTickCount();

				while (getTickCount() - tick < 2000) {
					if (unit.getFlag(0x10)) {
						delay(50);

						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		itemToCursor: function (item) {
			var i, tick;

			if (me.itemoncursor) { // Something already on cursor
				if (getUnit(100).gid === item.gid) { // Return true if the item is already on cursor
					return true;
				}

				this.dropItem(getUnit(100)); // If another item is on cursor, drop it
			}

			for (i = 0; i < 15; i += 1) {
				if (item.mode === 1) { // equipped
					sendPacket(1, 0x1c, 2, item.bodylocation);
				} else {
					sendPacket(1, 0x19, 4, item.gid);
				}

				tick = getTickCount();

				while (getTickCount() - tick < Math.max(500, me.ping * 2 + 200)) {
					if (me.itemoncursor) {
						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		dropItem: function (item) {
			var i, tick;

			if (!this.itemToCursor(item)) {
				return false;
			}

			for (i = 0; i < 15; i += 1) {
				sendPacket(1, 0x17, 4, item.gid);

				tick = getTickCount();

				while (getTickCount() - tick < Math.max(500, me.ping * 2 + 200)) {
					if (!me.itemoncursor) {
						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		castSkill: function (hand, wX, wY) {
			hand = (hand === 0) ? 0x0c : 0x05;
			sendPacket(1, hand, 2, wX, 2, wY);
		},

		unitCast: function (hand, who) {
			hand = (hand === 0) ? 0x11 : 0x0a;
			sendPacket(1, hand, 4, who.type, 4, who.gid);
		},

		flash: function (gid, wait = 300 + 2 * me.ping) {
			sendPacket(1, 0x4b, 4, 0, 4, gid);

			if (wait > 0) {
				delay(wait);
			}
		},
	};
}).call(null, module, require);