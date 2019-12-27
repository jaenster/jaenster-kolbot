/**
 *    @filename    Misc.js
 *    @author        kolton
 *    @desc        misc library containing Misc
 */

(function (module, require) {
	const Pather = require('Pather');
	const Config = require('Config');

	const Misc = module.exports = {
		// Click something
		click: function (button, shift, x, y) {
			if (arguments.length < 2) {
				throw new Error("Misc.click: Needs at least 2 arguments.");
			}

			while (!me.gameReady) {
				delay(100);
			}

			switch (arguments.length) {
				case 2:
					me.blockMouse = true;
					clickMap(button, shift, me.x, me.y);
					delay(20);
					clickMap(button + 2, shift, me.x, me.y);
					me.blockMouse = false;

					break;
				case 3:
					if (typeof (x) !== "object") {
						throw new Error("Misc.click: Third arg must be a Unit.");
					}

					me.blockMouse = true;
					clickMap(button, shift, x);
					delay(20);
					clickMap(button + 2, shift, x);
					me.blockMouse = false;

					break;
				case 4:
					me.blockMouse = true;
					clickMap(button, shift, x, y);
					delay(20);
					clickMap(button + 2, shift, x, y);
					me.blockMouse = false;

					break;
			}

			return true;
		},

		// Check if a player is in your party
		inMyParty: function (name) {
			if (me.name === name) {
				return true;
			}

			while (!me.gameReady) {
				delay(100);
			}

			var player, myPartyId;

			try {
				player = getParty();

				if (!player) {
					return false;
				}

				myPartyId = player.partyid;
				player = getParty(name); // May throw an error

				if (player && player.partyid !== 65535 && player.partyid === myPartyId) {
					return true;
				}
			} catch (e) {
				player = getParty();

				if (player) {
					myPartyId = player.partyid;

					while (player.getNext()) {
						if (player.partyid !== 65535 && player.partyid === myPartyId) {
							return true;
						}
					}
				}
			}

			return false;
		},

		// Get number of players within getUnit distance
		getNearbyPlayerCount: function () {
			var count = 0,
				player = getUnit(0);

			if (player) {
				do {
					if (!player.dead) {
						count += 1;
					}
				} while (player.getNext());
			}

			return count;
		},

		// Get total number of players in game
		getPlayerCount: function () {
			var count = 0,
				party = getParty();

			if (party) {
				do {
					count += 1;
				} while (party.getNext());
			}

			return count;
		},

		// Open a chest Unit
		openChest: function (unit) {
			// Skip invalid and Countess chests
			if (!unit || unit.x === 12526 || unit.x === 12565) {
				return false;
			}

			// already open
			if (unit.mode) {
				return true;
			}

			// locked chest, no keys
			if (me.classid !== 6 && unit.islocked && !me.findItem(543, 0, 3)) {
				return false;
			}

			var i, tick;

			for (i = 0; i < 3; i += 1) {
				if (Pather.moveTo(unit.x + 1, unit.y + 2, 3) && getDistance(me, unit.x + 1, unit.y + 2) < 5) {
					//Misc.click(0, 0, unit);
					sendPacket(1, 0x13, 4, unit.type, 4, unit.gid);
				}

				tick = getTickCount();

				while (getTickCount() - tick < 1000) {
					if (unit.mode) {
						return true;
					}

					delay(10);
				}
			}

			if (!me.idle) {
				Misc.click(0, 0, me.x, me.y); // Click to stop walking in case we got stuck
			}

			return false;
		},

		// Open all chests that have preset units in an area
		openChestsInArea: function (area, chestIds) {
			var i, coords, presetUnits;

			if (!area) {
				area = me.area;
			}

			// testing
			if (area !== me.area) {
				Pather.journeyTo(area);
			}

			coords = [];
			presetUnits = getPresetUnits(area, 2);

			if (!chestIds) {
				chestIds = [
					5, 6, 87, 104, 105, 106, 107, 143, 140, 141, 144, 146, 147, 148, 176, 177, 181, 183, 198, 240, 241,
					242, 243, 329, 330, 331, 332, 333, 334, 335, 336, 354, 355, 356, 371, 387, 389, 390, 391, 397, 405,
					406, 407, 413, 420, 424, 425, 430, 431, 432, 433, 454, 455, 501, 502, 504, 505, 580, 581
				];
			}

			if (!presetUnits) {
				return false;
			}

			while (presetUnits.length > 0) {
				if (chestIds.indexOf(presetUnits[0].id) > -1) {
					coords.push({
						x: presetUnits[0].roomx * 5 + presetUnits[0].x,
						y: presetUnits[0].roomy * 5 + presetUnits[0].y
					});
				}

				presetUnits.shift();
			}

			while (coords.length) {
				coords.sort((a, b) => a.distance - b.distance);
				Pather.moveToUnit(coords[0], 1, 2);
				this.openChests(20);

				for (i = 0; i < coords.length; i += 1) {
					if (getDistance(coords[i].x, coords[i].y, coords[0].x, coords[0].y) < 20) {
						coords.shift();
					}
				}
			}

			return true;
		},

		openChests: function (range) {
			var unit,
				unitList = [],
				containers = ["chest", "chest3", "armorstand", "weaponrack"];

			if (!range) {
				range = 15;
			}
			const Pickit = require('Pickit');

			// Testing all container code
			if (Config.OpenChests === 2) {
				containers = [
					"chest", "loose rock", "hidden stash", "loose boulder", "corpseonstick", "casket", "armorstand", "weaponrack", "barrel", "holeanim", "tomb2",
					"tomb3", "roguecorpse", "ratnest", "corpse", "goo pile", "largeurn", "urn", "chest3", "jug", "skeleton", "guardcorpse", "sarcophagus", "object2",
					"cocoon", "basket", "stash", "hollow log", "hungskeleton", "pillar", "skullpile", "skull pile", "jar3", "jar2", "jar1", "bonechest", "woodchestl",
					"woodchestr", "barrel wilderness", "burialchestr", "burialchestl", "explodingchest", "chestl", "chestr", "groundtomb", "icecavejar1", "icecavejar2",
					"icecavejar3", "icecavejar4", "deadperson", "deadperson2", "evilurn", "tomb1l", "tomb3l", "groundtombl"
				];
			}

			unit = getUnit(2);

			if (unit) {
				do {
					if (unit.name && unit.mode === 0 && getDistance(me.x, me.y, unit.x, unit.y) <= range && containers.indexOf(unit.name.toLowerCase()) > -1) {
						unitList.push(copyUnit(unit));
					}
				} while (unit.getNext());
			}

			while (unitList.length > 0) {
				unitList.sort((a, b) => a.distance - b.distance);

				unit = unitList.shift();

				if (unit && (Pather.useTeleport() || !checkCollision(me, unit, 0x4)) && this.openChest(unit)) {
					Pickit.pickItems();
				}
			}

			return true;
		},

		shrineStates: false,

		scanShrines: function (range) {
			if (!Config.ScanShrines.length) {
				return false;
			}

			if (!range) {
				range = Pather.useTeleport() ? 25 : 15;
			}

			var i, j, shrine,
				index = -1,
				shrineList = [];
			const Pickit = require('Pickit');

			// Initiate shrine states
			if (!this.shrineStates) {
				this.shrineStates = [];

				for (i = 0; i < Config.ScanShrines.length; i += 1) {
					switch (Config.ScanShrines[i]) {
						case 0: // None
						case 1: // Refilling
						case 2: // Health
						case 3: // Mana
						case 4: // Health Exchange (doesn't exist)
						case 5: // Mana Exchange (doesn't exist)
						case 16: // Enirhs (doesn't exist)
						case 17: // Portal
						case 18: // Gem
						case 19: // Fire
						case 20: // Monster
						case 21: // Exploding
						case 22: // Poison
							this.shrineStates[i] = 0; // no state

							break;
						case 6: // Armor
						case 7: // Combat
						case 8: // Resist Fire
						case 9: // Resist Cold
						case 10: // Resist Lightning
						case 11: // Resist Poison
						case 12: // Skill
						case 13: // Mana recharge
						case 14: // Stamina
						case 15: // Experience
							// Both states and shrines are arranged in same order with armor shrine starting at 128
							this.shrineStates[i] = Config.ScanShrines[i] + 122;

							break;
					}
				}
			}

			shrine = getUnit(2, "shrine");

			if (shrine) {
				// Build a list of nearby shrines
				do {
					if (shrine.mode === 0 && getDistance(me.x, me.y, shrine.x, shrine.y) <= range) {
						shrineList.push(copyUnit(shrine));
					}
				} while (shrine.getNext());

				// Check if we have a shrine state, store its index if yes
				for (i = 0; i < this.shrineStates.length; i += 1) {
					if (me.getState(this.shrineStates[i])) {
						index = i;

						break;
					}
				}

				for (i = 0; i < Config.ScanShrines.length; i += 1) {
					for (j = 0; j < shrineList.length; j += 1) {
						// Get the shrine if we have no active state or to refresh current state or if the shrine has no state
						// Don't override shrine state with a lesser priority shrine
						if (index === -1 || i <= index || this.shrineStates[i] === 0) {
							if (shrineList[j].objtype === Config.ScanShrines[i] && (Pather.useTeleport() || !checkCollision(me, shrineList[j], 0x4))) {
								this.getShrine(shrineList[j]);

								// Gem shrine - pick gem
								if (Config.ScanShrines[i] === 18) {
									Pickit.pickItems();
								}
							}
						}
					}
				}
			}

			return true;
		},

		// Use a shrine Unit
		getShrine: function (unit) {
			if (unit.mode) {
				return false;
			}

			var i, tick;

			for (i = 0; i < 3; i += 1) {
				if (getDistance(me, unit) < 4 || Pather.moveToUnit(unit, 3, 0)) {
					Misc.click(0, 0, unit);
					//unit.interact();
				}

				tick = getTickCount();

				while (getTickCount() - tick < 1000) {
					if (unit.mode) {
						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		// Check all shrines in area and get the first one of specified type
		getShrinesInArea: function (area, type, use) {
			var i, coords, shrine,
				shrineLocs = [],
				shrineIds = [2, 81, 83],
				unit = getPresetUnits(area);

			if (unit) {
				for (i = 0; i < unit.length; i += 1) {
					if (shrineIds.indexOf(unit[i].id) > -1) {
						shrineLocs.push([unit[i].roomx * 5 + unit[i].x, unit[i].roomy * 5 + unit[i].y]);
					}
				}
			}

			while (shrineLocs.length > 0) {
				shrineLocs.sort((a, b) => a.distance - b.distance);

				coords = shrineLocs.shift();

				Pather.moveTo(coords[0], coords[1], 2);

				shrine = getUnit(2, "shrine");

				if (shrine) {
					do {
						if (shrine.objtype === type && shrine.mode === 0) {
							Pather.moveTo(shrine.x - 2, shrine.y - 2);

							if (!use || this.getShrine(shrine)) {
								return true;
							}
						}
					} while (shrine.getNext());
				}
			}

			return false;
		},

		getItemDesc: function (unit) {
			var i, desc, index,
				stringColor = "";

			desc = unit.description;

			if (!desc) {
				return "";
			}

			desc = desc.split("\n");

			// Lines are normally in reverse. Add color tags if needed and reverse order.
			for (i = 0; i < desc.length; i += 1) {
				if (desc[i].indexOf(getLocaleString(3331)) > -1) { // Remove sell value
					desc.splice(i, 1);

					i -= 1;
				} else {
					// Add color info
					if (!desc[i].match(/^(y|ÿ)c/)) {
						desc[i] = stringColor + desc[i];
					}

					// Find and store new color info
					index = desc[i].lastIndexOf("ÿc");

					if (index > -1) {
						stringColor = desc[i].substring(index, index + "ÿ".length + 2);
					}
				}

				desc[i] = desc[i].replace(/(y|ÿ)c([0-9!"+<:;.*])/g, "\\xffc$2");
			}

			if (desc[desc.length - 1]) {
				desc[desc.length - 1] = desc[desc.length - 1].trim() + " (" + unit.ilvl + ")";
			}

			desc = desc.reverse().join("\n");

			return desc;
		},

		getItemSockets: function (unit) {
			var i, code,
				sockets = unit.getStat(194),
				subItems = unit.getItemsEx(),
				tempArray = [];

			if (subItems) {
				switch (unit.sizex) {
					case 2:
						switch (unit.sizey) {
							case 3: // 2 x 3
								switch (sockets) {
									case 4:
										tempArray = [subItems[0], subItems[3], subItems[2], subItems[1]];

										break;
									case 5:
										tempArray = [subItems[1], subItems[4], subItems[0], subItems[3], subItems[2]];

										break;
									case 6:
										tempArray = [subItems[0], subItems[3], subItems[1], subItems[4], subItems[2], subItems[5]];

										break;
								}

								break;
							case 4: // 2 x 4
								switch (sockets) {
									case 5:
										tempArray = [subItems[1], subItems[4], subItems[0], subItems[3], subItems[2]];

										break;
									case 6:
										tempArray = [subItems[0], subItems[3], subItems[1], subItems[4], subItems[2], subItems[5]];

										break;
								}

								break;
						}

						break;
				}

				if (tempArray.length === 0 && subItems.length > 0) {
					tempArray = subItems.slice(0);
				}
			}

			for (i = 0; i < sockets; i += 1) {
				if (tempArray[i]) {
					code = tempArray[i].code;

					if ([10, 12, 58, 82, 83, 84].indexOf(tempArray[i].itemType) > -1) {
						code += (tempArray[i].gfx + 1);
					}
				} else {
					code = "gemsocket";
				}

				tempArray[i] = code;
			}

			return tempArray;
		},

		useItemLog: true, // Might be a bit dirty

		itemLogger: function (action, unit, text) {
			if (!Config.ItemInfo || !this.useItemLog) {
				return false;
			}

			var desc,
				date = new Date(),
				dateString = "[" + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -5).replace(/-/g, '/').replace('T', ' ') + "]";

			switch (action) {
				case "Sold":
					if (Config.ItemInfoQuality.indexOf(unit.quality) === -1) {
						return false;
					}

					desc = this.getItemDesc(unit).split("\n").join(" | ").replace(/(\\xff|ÿ)c[0-9!"+<:;.*]/gi, "").trim();

					break;
				case "Kept":
				case "Field Kept":
				case "Runeword Kept":
				case "Cubing Kept":
				case "Shopped":
				case "Gambled":
				case "Dropped":
					desc = this.getItemDesc(unit).split("\n").join(" | ").replace(/(\\xff|ÿ)c[0-9!"+<:;.*]|\/|\\/gi, "").trim();

					break;
				case "No room for":
					desc = unit.name;

					break;
				default:
					desc = unit.fname.split("\n").reverse().join(" ").replace(/(\\xff|ÿ)c[0-9!"+<:;.*]|\/|\\/gi, "").trim();

					break;
			}

			const Pickit = require('Pickit');
			return this.fileAction("logs/ItemLog.txt", 2, dateString + " <" + me.profile + "> <" + action + "> (" + Pickit.itemQualityToName(unit.quality) + ") " + desc + (text ? " {" + text + "}" : "") + "\n");
		},

		// Log kept item stats in the manager.
		logItem: function (action, unit, keptLine) {
			if (!this.useItemLog) {
				return false;
			}

			var i;

			if (!Config.LogKeys && ["pk1", "pk2", "pk3"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogOrgans && ["dhn", "bey", "mbr"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogLowRunes && ["r01", "r02", "r03", "r04", "r05", "r06", "r07", "r08", "r09", "r10", "r11", "r12", "r13", "r14"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogMiddleRunes && ["r15", "r16", "r17", "r18", "r19", "r20", "r21", "r22", "r23"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogHighRunes && ["r24", "r25", "r26", "r27", "r28", "r29", "r30", "r31", "r32", "r33"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogLowGems && ["gcv", "gcy", "gcb", "gcg", "gcr", "gcw", "skc", "gfv", "gfy", "gfb", "gfg", "gfr", "gfw", "skf", "gsv", "gsy", "gsb", "gsg", "gsr", "gsw", "sku"].indexOf(unit.code) > -1) {
				return false;
			}

			if (!Config.LogHighGems && ["gzv", "gly", "glb", "glg", "glr", "glw", "skl", "gpv", "gpy", "gpb", "gpg", "gpr", "gpw", "skz"].indexOf(unit.code) > -1) {
				return false;
			}

			for (i = 0; i < Config.SkipLogging.length; i++) {
				if (Config.SkipLogging[i] === unit.classid || Config.SkipLogging[i] === unit.code) {
					return false;
				}
			}

			var lastArea, code, desc, sock, itemObj,
				color = -1,
				name = unit.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<:;.*]|\/|\\/g, "").trim();

			desc = this.getItemDesc(unit);
			color = unit.getColor();

			if (action.match("kept", "i")) {
				lastArea = DataFile.getStats().lastArea;

				if (lastArea) {
					desc += ("\n\\xffc0Area: " + lastArea);
				}
			}

			code = unit.skinCode;
			sock = unit.getItem();

			if (sock) {
				do {
					if (sock.itemType === 58) {
						desc += "\n\n";
						desc += this.getItemDesc(sock);
					}
				} while (sock.getNext());
			}

			if (keptLine) {
				desc += ("\n\\xffc0Line: " + keptLine);
			}

			desc += "$" + (unit.getFlag(0x400000) ? ":eth" : "");

			itemObj = {
				title: action + " " + name,
				description: desc,
				image: code,
				textColor: unit.quality,
				itemColor: color,
				header: "",
				sockets: this.getItemSockets(unit)
			};

			D2Bot.printToItemLog(itemObj);

			return true;
		},

		// skip low items: MuleLogger
		skipItem: function (id) {
			switch (id) {
				//case 549: // horadric cube
				case   0: // hand axe
				case  10: // wand
				case  14: // club
				case  25: // shortsword
				case  47: // javelin
				case  63: // shortstaff
				case 175: // katar
				case 328: // buckler
				case 513: // stamina potion
				case 514: // antidote potion
				case 515: // rejuvenationpotion
				case 516: // fullrejuvenationpotion
				case 517: // thawing potion
				case 518: // tomeoftownportal
				case 519: // tomeofidentify
				case 529: // scrolloftownportal
				case 530: // scrollofidentify
				case 543: // key
				case 587: // minorhealingpotion
				case 588: // lighthealingpotion
				case 589: // healingpotion
				case 590: // greathealingpotion
				case 591: // superhealingpotion
				case 592: // minormanapotion
				case 593: // lightmanapotion
				case 594: // manapotion
				case 595: // greatermanapotion
				case 596: // supermanapotion
					return true;
			}

			return false;
		},

		// Change into werewolf or werebear
		shapeShift: function (mode) {
			var i, tick, skill, state;

			switch (mode.toString().toLowerCase()) {
				case "0":
					return false;
				case "1":
				case "werewolf":
					state = 139;
					skill = 223;

					break;
				case "2":
				case "werebear":
					state = 140;
					skill = 228;

					break;
				default:
					throw new Error("shapeShift: Invalid parameter");
			}

			if (me.getState(state)) {
				return true;
			}

			for (i = 0; i < 3; i += 1) {
				me.cast(skill, 0);

				tick = getTickCount();

				while (getTickCount() - tick < 2000) {
					if (me.getState(state)) {
						delay(250);

						return true;
					}

					delay(10);
				}
			}

			return false;
		},

		// Change back to human shape
		unShift: function () {
			var i, tick;

			if (me.getState(139) || me.getState(140)) {
				for (i = 0; i < 3; i += 1) {
					me.cast(me.getState(139) ? 223 : 228);

					tick = getTickCount();

					while (getTickCount() - tick < 2000) {
						if (!me.getState(139) && !me.getState(140)) {
							delay(250);

							return true;
						}

						delay(10);
					}
				}
			} else {
				return true;
			}

			return false;
		},

		// Go to town when low on hp/mp or when out of potions. can be upgraded to check for curses etc.
		townCheck: function () {
			var i, potion, check,
				needhp = true,
				needmp = true;

			// Can't tp from uber trist or when dead
			if (me.area === 136 || me.dead) {
				return false;
			}
			const Town = require('Town');

			if (Config.TownCheck && !me.inTown) {
				try {
					if (me.gold > 1000) {
						for (i = 0; i < 4; i += 1) {
							if (Config.BeltColumn[i] === "hp" && Config.MinColumn[i] > 0) {
								potion = me.getItem(-1, 2); // belt item

								if (potion) {
									do {
										if (potion.code.indexOf("hp") > -1) {
											needhp = false;

											break;
										}
									} while (potion.getNext());
								}

								if (needhp) {
									print("We need healing potions");

									check = true;
								}
							}

							if (Config.BeltColumn[i] === "mp" && Config.MinColumn[i] > 0) {
								potion = me.getItem(-1, 2); // belt item

								if (potion) {
									do {
										if (potion.code.indexOf("mp") > -1) {
											needmp = false;

											break;
										}
									} while (potion.getNext());
								}

								if (needmp) {
									print("We need mana potions");

									check = true;
								}
							}
						}
					}

					if (Config.OpenChests && Town.needKeys()) {
						check = true;
					}
				} catch (e) {
					check = false;
				}
			}

			if (check) {
				scriptBroadcast("townCheck");
				delay(500);

				return true;
			}

			return false;
		},

		// Log someone's gear
		spy: function (name) {
			if (!isIncluded("oog.js")) {
				include("oog.js");
			}


			var item,
				unit = getUnit(-1, name);

			if (!unit) {
				print("player not found");

				return false;
			}

			item = unit.getItem();

			if (item) {
				do {
					this.logItem(unit.name, item);
				} while (item.getNext());
			}

			return true;
		},

		// hopefully multi-thread and multi-profile friendly txt func
		/*fileAction: function (path, mode, msg) {
			var i, file,
				contents = "";

	MainLoop:
			for (i = 0; i < 30; i += 1) {
				try {
					file = File.open(path, mode);

					switch (mode) {
					case 0: // read
						contents = file.readLine();

						break MainLoop;
					case 1: // write
					case 2: // append
						file.write(msg);

						break MainLoop;
					}
				} catch (e) {

				} finally {
					if (file) {
						file.close();
					}
				}

				delay(100);
			}

			return mode === 0 ? contents : true;
		},*/

		fileAction: function (path, mode, msg) {
			var i,
				contents = "";

			MainLoop:
				for (i = 0; i < 30; i += 1) {
					try {
						switch (mode) {
							case 0: // read
								contents = FileTools.readText(path);

								break MainLoop;
							case 1: // write
								FileTools.writeText(path, msg);

								break MainLoop;
							case 2: // append
								FileTools.appendText(path, msg);

								break MainLoop;
						}
					} catch (e) {

					}

					delay(100);
				}

			return mode === 0 ? contents : true;
		},

		fileActionAsync: function (path, mode, msg) {
			const Worker = require('Worker');
			const Promise = require('Promise');
			if (mode === 0) { // just read
				return FileTools.readText(path);
			}

			let done, tick = getTickCount();
			const retry = function (amount = 0) {
				// try again!
				try {
					FileTools[(mode === 1 ? 'write' : 'append') + 'Text'].apply(FileTools, [path, msg]);
				} catch (e) {
					done = false;
				}

				if (getTickCount() - tick < 5000) { // only try for 5000 seconds times
					Worker.push(() => retry(amount++))
				}
			};
			retry(0);

			return new Promise((resolve, reject) => (done && resolve(done)) || (getTickCount() - tick > 5000 && reject(done))).catch(() => {
			});
		},

		errorConsolePrint: true,
		screenshotErrors: false,

		// Report script errors to logs/ScriptErrorLog.txt
		errorReport: function (error, script) {
			var i, date, dateString, msg, oogmsg, filemsg, source, stack,
				stackLog = "";

			date = new Date();
			dateString = "[" + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -5).replace(/-/g, '/').replace('T', ' ') + "]";

			if (typeof error === "string") {
				msg = error;
				oogmsg = error.replace(/ÿc[0-9!"+<:;.*]/gi, "");
				filemsg = dateString + " <" + me.profile + "> " + error.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";
			} else {
				source = error.fileName.substring(error.fileName.lastIndexOf("\\") + 1, error.fileName.length);
				msg = "ÿc1Error in ÿc0" + script + " ÿc1(" + source + " line ÿc1" + error.lineNumber + "): ÿc1" + error.message;
				oogmsg = " Error in " + script + " (" + source + " #" + error.lineNumber + ") " + error.message + " (Area: " + me.area + ", Ping:" + me.ping + ", Game: " + me.gamename + ")";
				filemsg = dateString + " <" + me.profile + "> " + msg.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";

				if (error.hasOwnProperty("stack")) {
					stack = error.stack;

					if (stack) {
						stack = stack.split("\n");

						if (stack && typeof stack === "object") {
							stack.reverse();
						}

						for (i = 0; i < stack.length; i += 1) {
							if (stack[i]) {
								stackLog += stack[i].substr(0, stack[i].indexOf("@") + 1) + stack[i].substr(stack[i].lastIndexOf("\\") + 1, stack[i].length - 1);

								if (i < stack.length - 1) {
									stackLog += ", ";
								}
							}
						}
					}
				}

				if (stackLog) {
					filemsg += "Stack: " + stackLog + "\n";
				}
			}

			if (this.errorConsolePrint) {
				D2Bot.printToConsole(oogmsg, 10);
			}

			showConsole();
			print(msg);
			this.fileAction("logs/ScriptErrorLog.txt", 2, filemsg);

			if (this.screenshotErrors) {
				takeScreenshot();
				delay(500);
			}
		},

		debugLog: function (msg) {
			if (!Config.Debug) {
				return;
			}

			debugLog(me.profile + ": " + msg);
		},

		// Use a NPC menu. Experimental function, subject to change
		// id = string number (with exception of Ressurect merc). http://www.blizzhackers.cc/viewtopic.php?f=209&t=378493
		useMenu: function (id) {
			//print("useMenu " + getLocaleString(id));

			var i, npc, lines;

			switch (id) {
				case 0x1507: // Resurrect (non-English dialog)
				case 0x0D44: // Trade (crash dialog)
					npc = getInteractedNPC();

					if (npc) {
						npc.useMenu(id);
						delay(750);

						return true;
					}

					break;
			}

			lines = getDialogLines();

			if (!lines) {
				return false;
			}

			for (i = 0; i < lines.length; i += 1) {
				if (lines[i].selectable && lines[i].text.indexOf(getLocaleString(id)) > -1) {
					getDialogLines()[i].handler();
					delay(100);

					return true;
				}
			}

			return false;
		},

		clone: function (obj) {
			var i, copy, attr;

			// Handle the 3 simple types, and null or undefined
			if (null === obj || "object" !== typeof obj) {
				return obj;
			}

			// Handle Date
			if (obj instanceof Date) {
				copy = new Date();

				copy.setTime(obj.getTime());

				return copy;
			}

			// Handle Array
			if (obj instanceof Array) {
				copy = [];

				for (i = 0; i < obj.length; i += 1) {
					copy[i] = this.clone(obj[i]);
				}

				return copy;
			}

			// Handle Object
			if (obj instanceof Object) {
				copy = {};

				for (attr in obj) {
					if (obj.hasOwnProperty(attr)) {
						copy[attr] = this.clone(obj[attr]);
					}
				}

				return copy;
			}

			throw new Error("Unable to copy obj! Its type isn't supported.");
		},

		copy: function (from) {
			var i,
				obj = {};

			for (i in from) {
				if (from.hasOwnProperty(i)) {
					obj[i] = this.clone(from[i]);
				}
			}

			return obj;
		},

		poll: function (check, timeout = 6000, sleep = 40) {
			let ret, start = getTickCount();

			while (getTickCount() - start <= timeout) {
				if ((ret = check()))
					return ret;

				delay(sleep);
			}

			return false;
		},

		getUIFlags: function (excluded = []) { // returns array of UI flags that are set, or null if none are set
			if (!me.gameReady) {
				return null;
			}

			const MAX_FLAG = 37;
			let flags = [];

			if (typeof excluded !== 'object' || excluded.length === undefined) {
				excluded = [excluded]; // not an array-like object, make it an array
			}

			for (let c = 1; c <= MAX_FLAG; c++) { // anything over 37 crashes
				if (c !== 0x23 && excluded.indexOf(c) === -1 && getUIFlag(c)) { // 0x23 is always set in-game
					flags.push(c);
				}
			}

			return flags.length ? flags : null;
		}
	};
}).call(null, module, require);