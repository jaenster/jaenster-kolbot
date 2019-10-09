/**
 * @description A baalrun made for speed, not for mf
 * @author Jaenster
 */

function SpeedBaal(Config, Attack, Pickit) {
	const Precast = require('Precast');
	const TownPrecast = require('TownPrecast');
	const GameData = require('GameData');
	const Skills = require('Skills');
	const PreAttack = require('PreAttack');

	const getUnits = (...args) => {
			let units = [], unit = getUnit.apply(undefined, args);

			if (unit instanceof Unit) {
				do {
					unit && units.push(copyUnit(unit));
				} while (unit.getNext());
			}

			return units;
		},
		self = this,
		/**
		 * @param x
		 * @param y
		 * @constructor
		 */
		Spot = function (x, y) {
			this.x = x;
			this.y = y;

			this.clear = () => this.moveTo() && self.clear();
			Object.defineProperty(this, 'distance', {
				get: function () {
					return getDistance.apply(null, [me, x, y]);
				}
			});
		},
		spots = {
			throne: {
				tp: new Spot(15083, 5035),
				baal: new Spot(15089, 5011),
				chamberPortal: new Spot(15089, 5006),
				center: new Spot(15094, 5029),
			},
			worldstone: {
				fastMove: new Spot(15144, 5892),
				baalSpot: new Spot(15134, 5923)
			}
		};

	this.toThrone = function () {
		Town.doChores();
		Config.FieldID && Town.fieldID();

		// 2 ways to go to throne, either travel our self, or take an portal.
		if (!config.Follower) {
			let path = [[15112, 5206], [15111, 5175], [15112, 5141], [15109, 5107], [15113, 5073], [15083, 5035]];
			TownPrecast();
			// go to the throne
			Pather.journeyTo(sdk.areas.ThroneOfDestruction);

			// A predefined path is quicker as always calculating the path over and over again, this is the fastest route in throne ;)
			path.forEach(args => Pather.moveTo.apply(Pather, args));

			//ToDo; check if alone in game, if so, dont create a portal. Or, dont recast one if its up already
			Pather.makePortal();

			return me.area === sdk.areas.ThroneOfDestruction;
		}

		// Precast in town, or go bo outside of town and return to act 4
		(TownPrecast.can && TownPrecast()) || Precast.outTown(_ => Pather.useWaypoint(sdk.areas.PandemoniumFortress));

		// In case we in aren't in act < 4, go to act 4
		me.area < sdk.areas.PandemoniumFortress && Town.goToTown(4); // Go to act 4.

		if (me.area === sdk.areas.PandemoniumFortress) {
			// in case we are in act 4.
			Town.move("tyrael");
			if (getUnit(2, sdk.units.RedPortalToAct5)) { // a red portal present?
				Pather.useUnit(2, sdk.units.RedPortalToAct5, sdk.areas.Harrogath);
			} else {
				let tyrael = getUnit(1, "tyrael");

				if (!tyrael || !tyrael.openMenu()) {
					Town.goToTown(5); // Looks like we failed, lets go to act 5 by wp
				} else {
					Misc.useMenu(0x58D2); // Travel to Harrogath
				}
			}
		}

		// If still not in town act 5, go to it and move to portal spot
		Town.goToTown(5) && Town.move("portalspot");

		// Wait for the portal
		for (let i = 0, delayI = 10; i < 30 * (1000 / delayI); i += 1) {
			if (config.Leecher) {

			} else if (Pather.usePortal(sdk.areas.ThroneOfDestruction, null)) {
				break;
			}

			delay(delayI);
		}

		return me.area === sdk.areas.ThroneOfDestruction;
	};

	this.wave = 0;
	this.nextWave = 1;
	this.baaltick = 0;

	this.checkThrone = function () {
		let waveMonsters = [23, 62, 105, 381, 557, 558, 571], waves = [1, 1, 2, 2, 3, 4, 5],
			monster = getUnits(1)
				.filter(monster => monster.attackable && waveMonsters.indexOf(monster.classid) > -1)
				.first();

		return monster ? waves[waveMonsters.indexOf(monster.classid)] : 0;
	};

	this.waves = function () {
		do {
			this.wave = this.checkThrone();
			this.wave && (this.nextWave = this.wave + 1);

			if (!this.wave) {
				this.clear(); // First clear the throne
				this.nextWave = 1
				PreAttack.do([0, 23, 105, 557, 558, 571][this.nextWave], 12e3 - (getTickCount() - this.baaltick), spots.throne.center);
			} else {

				print('wave:' + this.wave);
				// In a wave
				this.clear(); // First clear the throne
				this.afterWave();
			}

			delay(10);

			// In case we moved to far from the throne's center
			[15091, 5013].distance > 40 && !getUnit(1, sdk.units.BaalSitting) && [15092, 5041].moveTo();

			if (!getUnit(1, sdk.units.BaalSitting)) break;
		} while (this.wave !== 5 || this.checkThrone());

		return true;
	};

	this.afterWave = function (wave) {
		if (typeof Config.BossTraps !== 'undefined' && Array.isArray(Config.BossTraps) && Config.BossTraps.length) {
			Config.UseFade && Skill.cast(258); // cast bos

			Config.BossTraps.forEach((type, index) => Skill.cast(type, undefined, spots.throne.center.x - (Config.BossTraps.length / 2) + index, spots.throne.center.y - 10));

			Config.UseFade && Skill.cast(267); // cast fade
		}

		if (this.wave === 3) {
			let hydra = getUnit(1, getLocaleString(3325));
			!hydra && print('No hydra! <3');

		}
	};

	const ignoreMonster = [];
	this.clear = function (wave) {
		const getUnits_filted = () => getUnits(1, -1)
			.filter(unit => ignoreMonster.indexOf(unit.gid) === -1 && unit.hp > 0 && unit.attackable && spots.throne.center.distance < 40 && !checkCollision(me, unit, 0x0))
			.filter(
				unit => unit.x > 15070 && unit.x < 15120 // Between the x coords
					&& unit.y > 5000 && unit.y < 5075 // And between the y coords
			)
			.sort((a, b) => GameData.monsterEffort(a, a.area).effort - GameData.monsterEffort(b, b.area).effort - ((b.distance - a.distance) / 5));

		let units = getUnits_filted(), unit;
		if (units) for (; (units = getUnits_filted()) && units.length;) {
			delay(20);
			if (!(unit = units.first())) break; // shouldn't happen but to be sure
			for (let done = false; !done && unit.attackable;) {
				done = !unit.attack();
			}
		}
		return true;
	};

	this.baal = function () {
		if ([sdk.areas.WorldstoneChamber, sdk.areas.ThroneOfDestruction].indexOf(me.area) === -1) {
			// ToDo; magic to go to throne/WorldstoneChamber
		}
		Config.FieldID && Town.fieldID(); // perfect moment to have an empty inventory
		if (me.area === sdk.areas.ThroneOfDestruction) {
			// Go to WorldstoneChamber
			Pather.moveTo(15089, 5006);
			const baalSitting = !!getUnit(1, 543);

			while (getUnit(1, 543) && delay(3)) ;

			baalSitting && delay(1000); // Only a bit if baal wasnt there in the first place
			me.area !== sdk.areas.WorldstoneChamber && Pather.usePortal(null, null, getUnit(2, 563));
		}

		if (me.area !== sdk.areas.WorldstoneChamber) {
			throw Error('failed to go to the worldstone chamber');
		}

		switch (build.me) {
			case build.warcry:
			case build.convict:
				togglePartyScript(false);
				clickParty(getParty(), 3); // leave party
				break;
			case build.curser:
				let unit = getUnit(1, 544);
				if (unit) {
					print('cast lower curse on distance on baal');
					Skill.cast(91, 0, 15166, 5903);
					return true;
				}
				break;
		}
		// If we can teleport, move quickly over gap.
		me.getSkill(43, 1) && spots.worldstone.fastMove.moveTo();
		spots.worldstone.baalSpot.moveTo();
		Attack.kill(544); // Baal
		Pickit.pickItems();
		delay(rand(1000, 2000));
		return true;
	};


	if (!Array.prototype.first) {
		Array.prototype.first = function () {
			return this.length > 0 && this[0] || undefined;
		};
	}


	addEventListener('scriptmsg', data => typeof data === 'object' && data.hasOwnProperty('baaltick') && (self.baaltick = data.baaltick));

	// Set the settings
	config = typeof Config.SpeedBaal === 'object' && Config.SpeedBaal || {};
	!config.hasOwnProperty('Follower') && (config.Follower = false);
	!config.hasOwnProperty('OnWaveAttack') && (config.OnWaveAttack = undefined);
	!config.hasOwnProperty('Leecher') && (config.Leecher = undefined);
	!config.hasOwnProperty('Diablo') && (config.Diablo = {});

	const build = new function () {
		this.me = 0;
		this.warcry = 1;
		this.javazon = 2;
		this.hammerdin = 3;
		this.blizzard = 4;
		this.convict = 5;
		this.curser = 6;
		this.firesorc = 7;
		this.lightsorc = 8;
		(() => {
			const mostUsedSk = GameData.mostUsedSkills().filter(x => x.used > 10).map(x => x.skillId);
			switch (true) {
				case me.classid === sdk.charclass.Barbarian:
					return (this.me = this.warcry);

				case me.classid === sdk.charclass.Necromancer:
					return (this.me = this.curser);

				// If we have more as 5 hard points in conviction, pretty sure that is our goal
				case me.getSkill(sdk.skills.Conviction, 0) > 5:
					return (this.me = this.convict);

				case [sdk.skills.BlessedHammer, sdk.skills.HolyBolt].some(sk => mostUsedSk.indexOf(sk) !== -1):
					return (this.me = this.hammerdin);

				case [sdk.skills.Meteor, sdk.skills.FireBall].some(sk => mostUsedSk.indexOf(sk) !== -1):
					return (this.me = this.firesorc);

				case [sdk.skills.Blizzard, sdk.skills.FrozenOrb, sdk.skills.IceBolt].some(sk => mostUsedSk.indexOf(sk) !== -1):
					return (this.me = this.blizzard);

				case [sdk.skills.ChargedStrike, sdk.skills.LightningFury, sdk.skills.LightningStrike].some(sk => mostUsedSk.indexOf(sk) !== -1):
					return (this.me = this.javazon);

				case [sdk.skills.Lightning, sdk.skills.ChainLightning].some(sk => mostUsedSk.indexOf(sk) !== -1):
					return (this.me = this.lightsorc);
			}
		})();
	};

	me.switchWeapons(0); // make sure you wear gear on FIRST slot
	[self.toThrone, self.waves, self.baal].some(item => !item());
}

(function () {
	let currentFile = 'libs/bots/SpeedBaal.js';

	if (getScript(currentFile) && getScript(currentFile).name === getScript(true).name) {
		let tick, oldtick;
		tick = oldtick = 0;

		// Running as a thread
		addEventListener('gamepacket', bytes => bytes
			&& bytes.length
			&& (
				(
					bytes[0] === 0xA4 // baal laughs
					&& (tick = getTickCount())
				)
				// || (
				// 	bytes[0] === 0x89 // All seals and monsters done
				// 	&& (diaReady = true)
				// )
			) && false);


		// print('here');
		while (me.ingame) {
			delay(1000); // Just idle
			if (tick !== oldtick) {
				print('Baal laughed');
				oldtick = tick;
				delay(1000); // wait a while thanks to the magic of d2bs
				scriptBroadcast({
					baaltick: tick,
				});
			}
		}
	} else {
		// load the thread, if it isnt loaded yet
		getScript(currentFile) || load(currentFile);
	}
})();