/**
 *	@filename	Baal.js
 *	@author		kolton, modified by YGM
 *	@desc		clear Throne of Destruction and kill Baal
 */

function Baal(Config, Attack, Pickit, Pather, Town) {
	let portal, tick;

	const PreAttack = require('PreAttack');

	this.preattack = function () {
		let check,center = {x: 15094, y: 5029};

		PreAttack.do([0, 23, 105, 557, 558, 571][lastwave+1], 12e3 - (getTickCount() -tick), center);

		return false;
	};

	this.checkThrone = function () {
		var monster = getUnit(1);

		if (monster) {
			do {
				if (Attack.checkMonster(monster) && monster.y < 5080) {
					switch (monster.classid) {
					case 23:
					case 62:
						return 1;
					case 105:
					case 381:
						return 2;
					case 557:
						return 3;
					case 558:
						return 4;
					case 571:
						return 5;
					default:
						Attack.getIntoPosition(monster, 10, 0x4);
						Attack.clear(15);

						return false;
					}
				}
			} while (monster.getNext());
		}

		return false;
	};

	this.clearThrone = function () {
		var i, monster,
			monList = [],
			pos = [15094, 5022, 15094, 5041, 15094, 5060, 15094, 5041, 15094, 5022];

		if (Config.AvoidDolls) {
			monster = getUnit(1, 691);

			if (monster) {
				do {
					if (monster.x >= 15072 && monster.x <= 15118 && monster.y >= 5002 && monster.y <= 5079 && Attack.checkMonster(monster) && Attack.skipCheck(monster)) {
						monList.push(copyUnit(monster));
					}
				} while (monster.getNext());
			}

			if (monList.length) {
				monList.forEach(monster=> monster.kill());
			}
		}

		for (i = 0; i < pos.length; i += 2) {
			Pather.moveTo(pos[i], pos[i + 1]);
			Attack.clear(25);
		}
	};

	this.checkHydra = function () {
		var hydra = getUnit(1, getLocaleString(3325));
		if (hydra) {
			do {
				if (hydra.mode !== 12 && hydra.getStat(172) !== 2) {
					Pather.moveTo(15072, 5002);
					while (hydra.mode !== 12) {
						delay(500);
						if (!copyUnit(hydra).x) {
							break;
						}
					}

					break;
				}
			} while (hydra.getNext());
		}

		return true;
	};

	this.announce = function () {
		var count, string, souls, dolls,
			monster = getUnit(1);

		if (monster) {
			count = 0;

			do {
				if (Attack.checkMonster(monster) && monster.y < 5094) {
					if (getDistance(me, monster) <= 40) {
						count += 1;
					}

					if (!souls && monster.classid === 641) {
						souls = true;
					}

					if (!dolls && monster.classid === 691) {
						dolls = true;
					}
				}
			} while (monster.getNext());
		}

		if (count > 30) {
			string = "DEADLY!!!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 20) {
			string = "Lethal!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 10) {
			string = "Dangerous!" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else if (count > 0) {
			string = "Warm" + " " + count + " monster" + (count > 1 ? "s " : " ") + "nearby.";
		} else {
			string = "Cool TP. No immediate monsters.";
		}

		if (souls) {
			string += " Souls ";

			if (dolls) {
				string += "and Dolls ";
			}

			string += "in area.";
		} else if (dolls) {
			string += " Dolls in area.";
		}

		say(string);
	};

	Town();
	if (!Pather.journeyTo(131)) {
		throw new Error("Failed to move to Throne of Destruction.");
	}

	Pather.moveTo(15095, 5029);

	if (Config.Baal.DollQuit && getUnit(1, 691)) {
		say("Dolls found! NG.");

		return true;
	}

	if (Config.Baal.SoulQuit && getUnit(1, 641)) {
		say("Souls found! NG.");

		return true;
	}

	if (Config.PublicMode) {
		this.announce();
		Pather.moveTo(15118, 5002);
		Pather.makePortal();
		say(Config.Baal.HotTPMessage);
		Attack.clear(15);
	}

	this.clearThrone();

	if (Config.PublicMode) {
		Pather.moveTo(15118, 5045);
		Pather.makePortal();
		say(Config.Baal.SafeTPMessage);
	}

	let lastwave = 0;
	tick = getTickCount();

	Pather.moveTo(15094, me.classid === 3 ? 5029 : 5038);

MainLoop:
	while (true) {
		if (getDistance(me, 15094, me.classid === 3 ? 5029 : 5038) > 3) {
			Pather.moveTo(15094, me.classid === 3 ? 5029 : 5038);
		}

		if (!getUnit(1, 543)) {
			break MainLoop;
		}

		switch (lastwave = this.checkThrone()) {
		case 1:
			Attack.clear(40);

			tick = getTickCount();


			break;
		case 2:
			Attack.clear(40);

			tick = getTickCount();

			break;
		case 4:
			Attack.clear(40);

			tick = getTickCount();

			break;
		case 3:
			Attack.clear(40);
			this.checkHydra();

			tick = getTickCount();

			break;
		case 5:
			Attack.clear(40);

			break MainLoop;
		default:
			if (getTickCount() - tick < 7e3) {
				if (me.getState(2)) {
					Skill.setSkill(109, 0);
				}

				break;
			}

			if (!this.preattack()) {
				delay(100);
			}

			break;
		}

		delay(10);
	}

	if (Config.Baal.KillBaal) {
		if (Config.PublicMode) {
			say(Config.Baal.BaalMessage);
		}

		Pather.moveTo(15090, 5008);
		delay(5000);

		while (getUnit(1, 543)) {
			delay(500);
		}

		portal = getUnit(2, 563);

		if (portal) {
			Pather.usePortal(null, null, portal);
		} else {
			throw new Error("Couldn't find portal.");
		}

		Pather.moveTo(15134, 5923);
		Attack.kill(544); // Baal
		Pickit.pickItems();
	}

	return true;
}