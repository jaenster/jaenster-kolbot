/**
*	@filename	ToolsThread.js
*	@author		kolton
*	@desc		several tools to help the player - potion use, chicken, Diablo clone stop, map reveal, quit with player
*/

js_strict(true);

include('require.js');
include("OOG.js");


include("sdk.js ");
function main() {
	var Experience = {
		totalExp: [0, 0, 500, 1500, 3750, 7875, 14175, 22680, 32886, 44396, 57715, 72144, 90180, 112725, 140906, 176132, 220165, 275207, 344008, 430010, 537513, 671891, 839864, 1049830, 1312287, 1640359, 2050449, 2563061, 3203826, 3902260, 4663553, 5493363, 6397855, 7383752, 8458379, 9629723, 10906488, 12298162, 13815086, 15468534, 17270791, 19235252, 21376515, 23710491, 26254525, 29027522, 32050088, 35344686, 38935798, 42850109, 47116709, 51767302, 56836449, 62361819, 68384473, 74949165, 82104680, 89904191, 98405658, 107672256, 117772849, 128782495, 140783010, 153863570, 168121381, 183662396, 200602101, 219066380, 239192444, 261129853, 285041630, 311105466, 339515048, 370481492, 404234916, 441026148, 481128591, 524840254, 572485967, 624419793, 681027665, 742730244, 809986056, 883294891, 963201521, 1050299747, 1145236814, 1248718217, 1361512946, 1484459201, 1618470619, 1764543065, 1923762030, 2097310703, 2286478756, 2492671933, 2717422497, 2962400612, 3229426756, 3520485254, 0, 0],
		nextExp: [0, 500, 1000, 2250, 4125, 6300, 8505, 10206, 11510, 13319, 14429, 18036, 22545, 28181, 35226, 44033, 55042, 68801, 86002, 107503, 134378, 167973, 209966, 262457, 328072, 410090, 512612, 640765, 698434, 761293, 829810, 904492, 985897, 1074627, 1171344, 1276765, 1391674, 1516924, 1653448, 1802257, 1964461, 2141263, 2333976, 2544034, 2772997, 3022566, 3294598, 3591112, 3914311, 4266600, 4650593, 5069147, 5525370, 6022654, 6564692, 7155515, 7799511, 8501467, 9266598, 10100593, 11009646, 12000515, 13080560, 14257811, 15541015, 16939705, 18464279, 20126064, 21937409, 23911777, 26063836, 28409582, 30966444, 33753424, 36791232, 40102443, 43711663, 47645713, 51933826, 56607872, 61702579, 67255812, 73308835, 79906630, 87098226, 94937067, 103481403, 112794729, 122946255, 134011418, 146072446, 159218965, 173548673, 189168053, 206193177, 224750564, 244978115, 267026144, 291058498, 0, 0],
		expCurve: [13, 16, 110, 159, 207, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 225, 174, 92, 38, 5],
		expPenalty: [1024, 976, 928, 880, 832, 784, 736, 688, 640, 592, 544, 496, 448, 400, 352, 304, 256, 192, 144, 108, 81, 61, 46, 35, 26, 20, 15, 11, 8, 6, 5],
		monsterExp: [
			[1, 1, 1], [30, 78, 117], [40, 104, 156], [50, 131, 197], [60, 156, 234], [70, 182, 273], [80, 207, 311], [90, 234, 351], [100, 260, 390], [110, 285, 428], [120, 312, 468],
			[130, 338, 507], [140, 363, 545], [154, 401, 602], [169, 440, 660], [186, 482, 723], [205, 533, 800], [225, 584, 876], [248, 644, 966], [273, 708, 1062], [300, 779, 1169],
			[330, 857, 1286], [363, 942, 1413], [399, 1035, 1553], [439, 1139, 1709], [470, 1220, 1830], [503, 1305, 1958], [538, 1397, 2096], [576, 1494, 2241], [616, 1598, 2397],
			[659, 1709, 2564], [706, 1832, 2748], [755, 1958, 2937], [808, 2097, 3146], [864, 2241, 3362], [925, 2399, 3599], [990, 2568, 3852], [1059, 2745, 4118], [1133, 2939, 4409],
			[1212, 3144, 4716], [1297, 3365, 5048], [1388, 3600, 5400], [1485, 3852, 5778], [1589, 4121, 6182], [1693, 4409, 6614], [1797, 4718, 7077], [1901, 5051, 7577],
			[2005, 5402, 8103], [2109, 5783, 8675], [2213, 6186, 9279], [2317, 6618, 9927], [2421, 7080, 10620], [2525, 7506, 11259], [2629, 7956, 11934], [2733, 8435, 12653],
			[2837, 8942, 13413], [2941, 9477, 14216], [3045, 10044, 15066], [3149, 10647, 15971], [3253, 11286, 16929], [3357, 11964, 17946], [3461, 12680, 19020],
			[3565, 13442, 20163], [3669, 14249, 21374], [3773, 15104, 22656], [3877, 16010, 24015], [3981, 16916, 25374], [4085, 17822, 26733], [4189, 18728, 28092],
			[4293, 19634, 29451], [4397, 20540, 30810], [4501, 21446, 32169], [4605, 22352, 33528], [4709, 23258, 34887], [4813, 24164, 36246], [4917, 25070, 37605],
			[5021, 25976, 38964], [5125, 26882, 40323], [5229, 27788, 41682], [5333, 28694, 43041], [5437, 29600, 44400], [5541, 30506, 45759], [5645, 31412, 47118],
			[5749, 32318, 48477], [5853, 33224, 49836], [5957, 34130, 51195], [6061, 35036, 52554], [6165, 35942, 53913], [6269, 36848, 55272], [6373, 37754, 56631],
			[6477, 38660, 57990], [6581, 39566, 59349], [6685, 40472, 60708], [6789, 41378, 62067], [6893, 42284, 63426], [6997, 43190, 64785], [7101, 44096, 66144],
			[7205, 45002, 67503], [7309, 45908, 68862], [7413, 46814, 70221], [7517, 47720, 71580], [7621, 48626, 72939], [7725, 49532, 74298], [7829, 50438, 75657],
			[7933, 51344, 77016], [8037, 52250, 78375], [8141, 53156, 79734], [8245, 54062, 81093], [8349, 54968, 82452], [8453, 55874, 83811], [160000, 160000, 160000]
		],
		// Percent progress into the current level. Format: xx.xx%
		progress: function () {
			return me.getStat(12) === 99 ? 0 : (((me.getStat(13) - this.totalExp[me.getStat(12)]) / this.nextExp[me.getStat(12)]) * 100).toFixed(2);
		},

		// Total experience gained in current run
		gain: function () {
			return (me.getStat(13) - DataFile.getStats().experience);
		},

		// Percent experience gained in current run
		gainPercent: function () {
			return me.getStat(12) === 99 ? 0 : (this.gain() * 100 / this.nextExp[me.getStat(12)]).toFixed(6);
		},

		// Runs until next level
		runsToLevel: function () {
			return Math.round(((100 - this.progress()) / 100) * this.nextExp[me.getStat(12)] / this.gain());
		},

		// Total runs needed for next level (not counting current progress)
		totalRunsToLevel: function () {
			return Math.round(this.nextExp[me.getStat(12)] / this.gain());
		},

		// Total time till next level
		timeToLevel: function () {
			var tTLrawSeconds = (Math.floor((getTickCount() - me.gamestarttime) / 1000)).toString(),
				tTLrawtimeToLevel = this.runsToLevel() * tTLrawSeconds,
				tTLDays = Math.floor(tTLrawtimeToLevel / 86400),
				tTLHours = Math.floor((tTLrawtimeToLevel % 86400) / 3600),
				tTLMinutes = Math.floor(((tTLrawtimeToLevel % 86400) % 3600) / 60),
				tTLSeconds = ((tTLrawtimeToLevel % 86400) % 3600) % 60;

			//return tDays + "d " + tTLHours + "h " + tTLMinutes + "m " + tTLSeconds + "s";
			//return tTLDays + "d " + tTLHours + "h " + tTLMinutes + "m";
			return (tTLDays ? tTLDays + " d " : "") + (tTLHours ? tTLHours + " h " : "") + (tTLMinutes ? tTLMinutes + " m" : "");
		},

		// Get Game Time
		getGameTime: function () {
			var rawMinutes = Math.floor((getTickCount() - me.gamestarttime) / 60000).toString(),
				rawSeconds = (Math.floor((getTickCount() - me.gamestarttime) / 1000) % 60).toString();

			if (rawMinutes <= 9) {
				rawMinutes = "0" + rawMinutes;
			}

			if (rawSeconds <= 9) {
				rawSeconds = "0" + rawSeconds;
			}

			//return rawMinutes + "m " + rawSeconds + "s";
			return " (" + rawMinutes + ":" + rawSeconds + ")";
		},

		// Log to manager
		log: function () {
			var string,
				gain = this.gain(),
				progress = this.progress(),
				runsToLevel = this.runsToLevel(),
				totalRunsToLevel = this.totalRunsToLevel(),
				getGameTime = this.getGameTime(),
				timeToLevel = this.timeToLevel();

			//string = "[Game: " + me.gamename + (me.gamepassword ? "//" + me.gamepassword : "") + getGameTime + "] [Level: " + me.getStat(12) + " (" + progress + "%)] [XP: " + gain + "] [Games ETA: " + runsToLevel + "] [Time ETA: " + timeToLevel + "]";
			string = "[Game: " + me.gamename + (me.gamepassword ? "//" + me.gamepassword : "") + getGameTime + "] [Level: " + me.getStat(12) + " (" + progress + "%)] [XP: " + gain + "] [Games ETA: " + runsToLevel + "]";

			if (gain) {
				D2Bot.printToConsole(string, 4);

				if (me.getStat(12) > DataFile.getStats().level) {
					D2Bot.printToConsole("Congrats! You gained a level. Current level:" + me.getStat(12), 5);
				}
			}
		}
	};
	var i, mercHP, ironGolem, tick, merc, Config = require('Config'),
		debugInfo = {area: 0, currScript: "no entry"},
		pingTimer = [],
		quitFlag = false,
		cloneWalked = false,
		canQuit = true,
		timerLastDrink = [];
	const Misc = require('Misc');
	const Town = require('Town');
	const Pather = require('Pather');

	print("ÿc3Start ToolsThread script");
	Config();

	for (i = 0; i < 5; i += 1) {
		timerLastDrink[i] = 0;
	}

	// Reset core chicken
	me.chickenhp = -1;
	me.chickenmp = -1;

	// General functions
	this.checkPing = function (print) {
		// Quit after at least 5 seconds in game
		if (getTickCount() - me.gamestarttime < 5000) {
			return false;
		}

		var i;

		for (i = 0; i < Config.PingQuit.length; i += 1) {
			if (Config.PingQuit[i].Ping > 0) {
				if (me.ping >= Config.PingQuit[i].Ping) {
					me.overhead("High Ping");

					if (pingTimer[i] === undefined || pingTimer[i] === 0) {
						pingTimer[i] = getTickCount();
					}

					if (getTickCount() - pingTimer[i] >= Config.PingQuit[i].Duration * 1000) {
						if (print) {
							D2Bot.printToConsole("High ping (" + me.ping + "/" + Config.PingQuit[i].Ping + ") - leaving game.", 9);
						}

						scriptBroadcast("pingquit");

						return true;
					}
				} else {
					pingTimer[i] = 0;
				}
			}
		}

		return false;
	};

	this.initQuitList = function () {
		var i, string, obj,
			temp = [];

		for (i = 0; i < Config.QuitList.length; i += 1) {
			if (FileTools.exists("data/" + Config.QuitList[i] + ".json")) {
				string = Misc.fileAction("data/" + Config.QuitList[i] + ".json", 0);

				if (string) {
					obj = JSON.parse(string);

					if (obj && obj.hasOwnProperty("name")) {
						temp.push(obj.name);
					}
				}
			}
		}

		Config.QuitList = temp.slice(0);
	};

	this.getPotion = function (pottype, type) {
		var i,
			items = me.getItemsEx();

		if (!items || items.length === 0) {
			return false;
		}

		// Get highest id = highest potion first
		items.sort(function (a, b) {
			return b.classid - a.classid;
		});

		for (i = 0; i < items.length; i += 1) {
			if (type < 3 && items[i].mode === 0 && items[i].location === 3 && items[i].itemType === pottype) {
				print("ÿc2Drinking potion from inventory.");

				return copyUnit(items[i]);
			}

			if (items[i].mode === 2 && items[i].itemType === pottype) {
				return copyUnit(items[i]);
			}
		}

		return false;
	};

	this.togglePause = function () {
		var i,	script,
			scripts = ["default.dbj", "tools/townchicken.js", "tools/antihostile.js", "tools/party.js", "tools/rushthread.js"];

		for (i = 0; i < scripts.length; i += 1) {
			script = getScript(scripts[i]);

			if (script) {
				if (script.running) {
					if (i === 0) { // default.dbj
						print("ÿc1Pausing.");
					}

					// don't pause townchicken during clone walk
					if (scripts[i] !== "tools/townchicken.js" || !cloneWalked) {
						script.pause();
					}
				} else {
					if (i === 0) { // default.dbj
						print("ÿc2Resuming.");
					}

					script.resume();
				}
			}
		}

		return true;
	};

	this.stopDefault = function () {
		var script = getScript("default.dbj");

		if (script && script.running) {
			script.stop();
		}

		return true;
	};

	this.exit = function () {
		this.stopDefault();
		quit();
	};

	this.drinkPotion = function (type) {
		var pottype, potion,
			tNow = getTickCount();

		switch (type) {
		case 0:
		case 1:
			if ((timerLastDrink[type] && (tNow - timerLastDrink[type] < 1000)) || me.getState(type === 0 ? 100 : 106)) {
				return false;
			}

			break;
		case 2:
			if (timerLastDrink[type] && (tNow - timerLastDrink[type] < 300)) { // small delay for juvs just to prevent using more at once
				return false;
			}

			break;
		case 4:
			if (timerLastDrink[type] && (tNow - timerLastDrink[type] < 2000)) { // larger delay for juvs just to prevent using more at once, considering merc update rate
				return false;
			}

			break;
		default:
			if (timerLastDrink[type] && (tNow - timerLastDrink[type] < 8000)) {
				return false;
			}

			break;
		}

		if (me.mode === 0 || me.mode === 17 || me.mode === 18) { // mode 18 - can't drink while leaping/whirling etc.
			return false;
		}

		switch (type) {
		case 0:
		case 3:
			pottype = 76;

			break;
		case 1:
			pottype = 77;

			break;
		default:
			pottype = 78;

			break;
		}

		potion = this.getPotion(pottype, type);

		if (potion) {
			if (me.mode === 0 || me.mode === 17) {
				return false;
			}

			if (type < 3) {
				potion.interact();
			} else {
				try {
					clickItem(2, potion);
				} catch (e) {
					print("Couldn't give the potion to merc.");
				}
			}

			timerLastDrink[type] = getTickCount();

			return true;
		}

		return false;
	};

	this.getNearestMonster = function () {
		let gid,
			monster = getUnit(1),
			range = 30;
		if (monster) {
			do {
				if (monster.hp > 0 && monster.attackable && !monster.getParent()) {
					if (monster.distance < range) {
						range = monster.distance;
						gid = monster.gid;
					}
				}
			} while (monster.getNext());
		}

		if (gid) {
			monster = getUnit(1, -1, -1, gid);
		} else {
			monster = false;
		}

		if (monster) {
			return " to " + monster.name;
		}

		return "";
	};

	this.checkVipers = function () {
		var owner,
			monster = getUnit(1, 597);

		if (monster) {
			do {
				if (monster.getState(96)) {
					owner = monster.getParent();

					if (owner && owner.name !== me.name) {
						return true;
					}
				}
			} while (monster.getNext());
		}

		return false;
	};

	this.getIronGolem = function () {
		var owner,
			golem = getUnit(1, 291);

		if (golem) {
			do {
				owner = golem.getParent();

				if (owner && owner.name === me.name) {
					return copyUnit(golem);
				}
			} while (golem.getNext());
		}

		return false;
	};

	this.getNearestPreset = function () {
		var i, unit, dist, id;

		unit = getPresetUnits(me.area);
		dist = 99;

		for (i = 0; i < unit.length; i += 1) {
			if (getDistance(me, unit[i].roomx * 5 + unit[i].x, unit[i].roomy * 5 + unit[i].y) < dist) {
				dist = getDistance(me, unit[i].roomx * 5 + unit[i].x, unit[i].roomy * 5 + unit[i].y);
				id = unit[i].type + " " + unit[i].id;
			}
		}

		return id || "";
	};

	// Event functions
	this.keyEvent = function (key) {
		switch (key) {
		case 19: // Pause/Break key
			this.togglePause();

			break;
		case 123: // F12 key
			me.overhead("Revealing " + Pather.getAreaName(me.area));
			revealLevel(true);

			break;
		case 107: // Numpad +
			showConsole();

			// me.getStat(105) will return real FCR from gear + Config.FCR from char cfg
			var realFCR = me.getStat(105) - Config.FCR;
			var realIAS = me.getStat(93) - Config.IAS;
			var realFBR = me.getStat(102) - Config.FBR;
			var realFHR = me.getStat(99) - Config.FHR;

			print("ÿc4MF: ÿc0" + me.getStat(80) + " ÿc4GF: ÿc0" + me.getStat(79) + " ÿc1FR: ÿc0" + me.getStat(39) +
				" ÿc3CR: ÿc0" + me.getStat(43) + " ÿc9LR: ÿc0" + me.getStat(41) + " ÿc2PR: ÿc0" + me.getStat(45) +
				"\n" +
				"FCR: " + realFCR + " IAS: " + realIAS + " FBR: " + realFBR +
				" FHR: " + realFHR + " FRW: " + me.getStat(96) +
				"\n" +
				"CB: " + me.getStat(136) + " DS: " + me.getStat(141) + " OW: " + me.getStat(135) +
				" ÿc1LL: ÿc0" + me.getStat(60) + " ÿc3ML: ÿc0" + me.getStat(62) +
				" DR: " + me.getStat(36) + "% + " + me.getStat(34) + " MDR: " + me.getStat(37) + "% + " + me.getStat(35) +
				"\n" +
				(me.getStat(153) > 0 ? "ÿc3Cannot be Frozenÿc1" : "" ));

			break;
		case 101: // numpad 5
			break;
		case 102: // Numpad 6
			me.overhead("Logged char: " + me.name);

			break;
		case 109: // Numpad -
			Misc.spy(me.name);

			break;
		case 110: // decimal point
			say("/fps");

			break;
		case 111: // Numpad / ( slash )
			say("/nopickup");
			me.overhead("No pickup switch toggled");

			break;
		case 105: // numpad 9 - get nearest preset unit id
			print(this.getNearestPreset());

			break;
		case 106: // numpad * - precast
			require('Precast')();

			break;
		}
	};

	this.gameEvent = function (mode, param1, param2, name1, name2) {
		switch (mode) {
		case 0x00: // "%Name1(%Name2) dropped due to time out."
		case 0x01: // "%Name1(%Name2) dropped due to errors."
		case 0x03: // "%Name1(%Name2) left our world. Diablo's minions weaken."
			if (Config.AntiHostile) {
				scriptBroadcast("remove " + name1);
			}

			break;
		case 0x06: // "%Name1 was Slain by %Name2"
			if (Config.AntiHostile && param2 === 0x00 && name2 === me.name) {
				scriptBroadcast("mugshot " + name1);
			}

			break;
		case 0x07:
			if (Config.AntiHostile && param2 === 0x03) { // "%Player has declared hostility towards you."
				scriptBroadcast("findHostiles");
			}

			break;
		case 0x11: // "%Param1 Stones of Jordan Sold to Merchants"
			if (Config.DCloneQuit === 2) {
				D2Bot.printToConsole("SoJ sold in game. Leaving.");

				quitFlag = true;

				break;
			}

			if (Config.SoJWaitTime && me.gametype === 1) { // only do this in expansion
				D2Bot.printToConsole(param1 + " Stones of Jordan Sold to Merchants on IP " + me.gameserverip.split(".")[3], 7);
				Messaging.sendToScript("default.dbj", "soj");
			}

			break;
		case 0x12: // "Diablo Walks the Earth"
			if (Config.DCloneQuit > 0) {
				D2Bot.printToConsole("Diablo walked in game. Leaving.");

				quitFlag = true;

				break;
			}

			if (Config.StopOnDClone && me.gametype === 1) { // only do this in expansion
				D2Bot.printToConsole("Diablo Walks the Earth", 7);

				cloneWalked = true;

				this.togglePause();
				Town.goToTown();
				showConsole();
				print("ÿc4Diablo Walks the Earth");

				me.maxgametime = 0;

				if (Config.KillDclone) {
					load("tools/clonekilla.js");
				}
			}

			break;
		}
	};

	this.scriptEvent = function (msg) {
		var obj;

		switch (msg) {
		case "toggleQuitlist":
			canQuit = !canQuit;

			break;
		case "quit":
			quitFlag = true;

			break;
		default:
			try {
				obj = JSON.parse(msg);
			} catch (e) {
				return;
			}

			if (obj) {
				if (obj.hasOwnProperty("currScript")) {
					debugInfo.currScript = obj.currScript;
				}

				if (obj.hasOwnProperty("lastAction")) {
					debugInfo.lastAction = obj.lastAction;
				}

				//D2Bot.store(JSON.stringify(debugInfo));
				DataFile.updateStats("debugInfo", JSON.stringify(debugInfo));
			}

			break;
		}
	};

	// Cache variables to prevent a bug where d2bs loses the reference to Config object
	Config = Misc.copy(Config);
	tick = getTickCount();

	addEventListener("keyup", this.keyEvent);
	addEventListener("gameevent", this.gameEvent);
	addEventListener("scriptmsg", this.scriptEvent);
	//addEventListener("gamepacket", Events.gamePacket);

	// Start
	while (true) {
		try {
			if (me.gameReady && !me.inTown) {
				if (Config.IronGolemChicken > 0 && me.classid === 2) {
					if (!ironGolem || copyUnit(ironGolem).x === undefined) {
						ironGolem = this.getIronGolem();
					}

					if (ironGolem) {
						if (ironGolem.hp <= Math.floor(128 * Config.IronGolemChicken / 100)) { // ironGolem.hpmax is bugged with BO
							D2Bot.printToConsole("Irom Golem Chicken in " + Pather.getAreaName(me.area), 9);
							D2Bot.updateChickens();
							this.exit();

							break;
						}
					}
				}

				if (Config.UseMerc) {
					mercHP = getMercHP();
					merc = me.getMerc();

					if (mercHP > 0 && merc && merc.mode !== 12) {
						if (mercHP < Config.MercChicken) {
							D2Bot.printToConsole("Merc Chicken in " + Pather.getAreaName(me.area), 9);
							D2Bot.updateChickens();
							this.exit();

							break;
						}

						if (mercHP < Config.UseMercHP) {
							this.drinkPotion(3);
						}

						if (mercHP < Config.UseMercRejuv) {
							this.drinkPotion(4);
						}
					}
				}

				if (Config.ViperCheck && getTickCount() - tick >= 250) {
					if (this.checkVipers()) {
						D2Bot.printToConsole("Revived Tomb Vipers found. Leaving game.", 9);

						quitFlag = true;
					}

					tick = getTickCount();
				}

				if (this.checkPing(true)) {
					quitFlag = true;
				}
			}
		} catch (e) {
			Misc.errorReport(e, "ToolsThread");

			quitFlag = true;
		}

		if (quitFlag && canQuit) {
			print("ÿc8Run duration ÿc2" + ((getTickCount() - me.gamestarttime) / 1000));

			if (Config.LogExperience) {
				Experience.log();
			}

			this.checkPing(false); // In case of quitlist triggering first
			this.exit();

			break;
		}

		if (debugInfo.area !== Pather.getAreaName(me.area)) {
			debugInfo.area = Pather.getAreaName(me.area);

			//D2Bot.store(JSON.stringify(debugInfo));
			DataFile.updateStats("debugInfo", JSON.stringify(debugInfo));
		}

		delay(20);
	}

	return true;
}