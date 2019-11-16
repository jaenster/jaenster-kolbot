/**
 * @description implementation of the GeneticAlgorithm
 * @author Ryancrunchi
 */




global['GeneticAlgorithmAttack'] = (function (GameData, Skills, Config) {
	function GeneticAlgorithmAttack(Config, Attack, Pickit, Pather, Town, Misc) {

		let PresetMonsters = GameData.PresetMonsters;
		let AreaData = GameData.AreaData;
		let ping = me.ping;
		myPrint("ping : " + ping);

		/* PresetMonsters[presetUnit.id] =
	"Index":149,
	"ClassID":149,
	"Level":0,
	"Ranged":0,
	"Rarity":0,
	"Threat":0,
	"PetIgnore":0,
	"Align":0,
	"Melee":1,
	"NPC":0,
	"Demon":0,
	"Flying":0,
	"Boss":0,
	"ActBoss":0,
	"Killable":0,
	"Convertable":1,
	"NeverCount":0,
	"DeathDamage":0,
	"Regeneration":2,
	"LocaleString":"an evil force",
	"InternalName":"dummy",
	"ExperienceModifier":0,
	"Undead":0,
	"Drain":0,
	"Block":0,
	"Physical":0,
	"Magic":0,
	"Fire":0,
	"Lightning":0,
	"Cold":0,
	"Poison":0,
	"Minions":[],
	"GroupCount":{"Min":3,"Max":3},
	"MinionCount":{"Min":0,"Max":0}
	}
		*/

		this.geneticAlgorithm = null;

		addEventListener("keyup", function (key) {
			if (key == 68) {
				// "d" key
				if (!this.geneticAlgorithm || this.geneticAlgorithm.done) {
					this.geneticAlgorithm = new GA();
					this.geneticAlgorithm.start();
				} else {
					this.geneticAlgorithm.stop();
				}
			}
			if (key == 69) {
				// "e" key
				if (this.geneticAlgorithm && this.geneticAlgorithm.done) {
					this.geneticAlgorithm.continue();
				}
			}
		});

		while (me.ingame) {
			delay(40);
			/*var missiles = getEnemiesMissiles();
			if (missiles.length > 0) {
				var player = new SimulatedUnit(me);
				for (var m of missiles) {
					var collision = m.collisionWith(player);
					if (collision) {
						print("Collision !!");
						print(JSON.stringify(collision));
					}
				}
			}*/
			/*
			var realFCR = me.getStat(105)-Config.FCR;
			var realIAS = me.getStat(93) - Config.IAS;
			var realFBR = me.getStat(102) - Config.FBR;
			var realFHR = me.getStat(99) - Config.FHR;
			*/
		}
	};


	const POPULATION_SIZE = 50; // number of solutions
	const DNA_SIZE = 2;			 // number of commands per solution
	const MUTATION_RATE = 0.05;


	function GA() {
		this.matingPool = [];
		this.generations = 0;
		this.done = false;
		// init game state
		this.gameState = new GameState(new SimulatedUnit(me), getMonsters(), getMissiles());
		this.shouldStop = false;

		this.time = getTickCount();

		this.stop = function () {
			this.shouldStop = true;
		};

		let fcr = me.getStat(105) - Config.FCR;

		// This is the loop that generate next population and calculate fitness after the initial population
		this.continue = function () {
			// while there are monsters in gameState
			while (this.gameState.monsters.length > 0 && !this.shouldStop) {
				var time = getTickCount();
				do {
					var loopTime = time;
					this.naturalSelection();
					this.generateNextPopulation();
					this.calculateFitness(this.population, this.gameState);

					/*var best = this.getBest();
					if (best) {
						//myPrint("Best : "+best.fitness);
						//myPrint(JSON.stringify(best.genes));
						//delay(2000);
					}
					else {
						myPrint("No best found");
					}*/
					loopTime = (getTickCount() - loopTime) / 1000;

					myPrint("Generations : " + this.generations + " (" + loopTime + " s)");

					time = getTickCount() - time;
					print("time " + time);
					print("generations " + this.generations);
				}
				while (time < 40 * fcr); // 40ms = 1 frame time (25fps = 40ms/frame)

				var best = this.getBest();
				if (best) {
					myPrint("Best : " + best.fitness);
					myPrint(JSON.stringify(best));
					myPrint(best.gameState.debugString());
					best.apply();
					this.gameState = new GameState(new SimulatedUnit(me), getMonsters(), getMissiles());
					//myPrint("Real game state :");
					//myPrint(this.gameState.debugString());
					//delay(2000);
				} else {
					myPrint("No best found");
				}
			}
			// end while
		};

		this.start = function () {
			var time = getTickCount();
			this.time = time;
			this.done = false;
			this.shouldStop = false;
			this.population = new Array(POPULATION_SIZE);
			for (var i = 0; i < this.population.length; i++) {
				this.population[i] = new DNA(DNA_SIZE, this.gameState);
			}
			this.generations = 1;
			this.calculateFitness(this.population, this.gameState);

			this.continue();

			this.done = true;
			time = (getTickCount() - time) / 1000;
			myPrint("Overall time : " + time);
		};

		// Returns the best solution (having highest fitness) from current population
		this.getBest = function () {
			var bestFitness = -1;
			var bestIndex = -1;
			for (var i = 0; i < this.population.length; i++) {
				if (this.population[i].fitness > bestFitness) {
					bestFitness = this.population[i].fitness;
					bestIndex = i;
				}
			}
			if (bestIndex < 0) {
				return null;
			}
			return this.population[bestIndex];
		};

		// Calculate the fitness of all solutions in population for a given state
		// population : the solutions pool on which to calculate fitness
		// gameState : game state used to simulate solutions
		this.calculateFitness = function (population, gameState) {
			var time = getTickCount();
			for (var i = 0; i < population.length; i++) {
				population[i].calculateFitness(gameState);
			}
			time = (getTickCount() - time) / 1000;
			myPrint("calculateFitness time : " + time);
		};

		// Select the solutions proportionnaly based on fitness
		// https://en.wikipedia.org/wiki/Fitness_proportionate_selection
		this.naturalSelection = function () {
			var time = getTickCount();
			this.matingPool = [];

			var fitnessSum = this.population.reduce((sum, pop) => sum + pop.fitness, 0);

			this.matingPool = this.population;
			for (var i = 0; i < this.matingPool.length; i++) {
				var normalizedFitness = this.matingPool[i].fitness / fitnessSum;
				for (var j = i + 1; j < this.matingPool.length; j++) {
					normalizedFitness += this.matingPool[j].fitness / fitnessSum;
				}
				this.matingPool[i].normalizedFitness = normalizedFitness;
				//myPrint("normalizedFitness " + normalizedFitness);
			}
			this.matingPool.sort((a, b) => a.normalizedFitness - b.normalizedFitness);
			time = (getTickCount() - time) / 1000;
			myPrint("naturalSelection time : " + time);
		};

		// Create the next solutions pool by crossing random parents and mutating children
		this.generateNextPopulation = function () {
			var time = getTickCount();
			for (var i = 0; i < this.population.length; i++) {
				var a = Math.random();
				var b = Math.random();
				var parentA = this.matingPool.find(dna => dna.normalizedFitness > a);
				var parentB = this.matingPool.find(dna => dna.normalizedFitness > b);
				var child = parentA.crossover(parentB);
				child.mutate(MUTATION_RATE);
				this.population[i] = child;
			}
			this.generations++;
			time = (getTickCount() - time) / 1000;
			myPrint("generateNextPopulation time : " + time);
		};
	}

// A DNA represents a sequence of commands (genes)
	function DNA(size, gameState) {
		this.genes = new Array(size);
		this.fitness = 0;
		this.normalizedFitness = 0;
		this.gameState = gameState;
		for (var i = 0; i < this.genes.length; i++) {
			this.genes[i] = generateRandomGene(this.gameState);
		}

		// Simulates the commands (genes) and calculate the fitness of the gameState
		this.calculateFitness = function (gameState) {
			var newGameState = gameState;
			//myPrint("Game state before simulation :");
			//myPrint(newGameState.debugString());
			for (var i = 0; i < this.genes.length; i++) {
				//myPrint(JSON.stringify(this.genes[i]));
				newGameState = newGameState.simulate(this.genes[i]);
				this.fitness += newGameState.calculateFitness(this.genes[i]);
				//newGameState.debug();
			}
			//myPrint("Game state after simulation :");
			//myPrint(newGameState.debugString());
			this.gameState = newGameState;
		};

		// Single point crossover with another DNA. A midpoint is randomly selected to select genes from this or other DNA.
		// Returns a new DNA.
		// https://en.wikipedia.org/wiki/Crossover_(genetic_algorithm)#Single-point_crossover
		this.crossover = function (other) {
			var child = new DNA(this.genes.length, this.gameState);
			let midpoint = Math.randomIntBetween(0, child.genes.length - 1);
			for (var i = 0; i < child.genes.length; i++) {
				child.genes[i] = (i > midpoint) ? this.genes[i] : other.genes[i];
			}
			return child;
		};

		// Replaces a gene by a random one with mutationRate chances.
		this.mutate = function (mutationRate) {
			for (var i = 0; i < this.genes.length; i++) {
				if (Math.random() < mutationRate) {
					this.genes[i] = generateRandomGene(this.gameState);
				}
			}
		};

		// Use this DNA to play
		this.apply = function () {
			for (var i = 0; i < this.genes.length; i++) {
				this.genes[i].apply();
			}
		};
	}


// A Command is a solution (a move, an attack or whatever you can do in game (as long as you define it))
	function Command(name, args) {
		this.name = name;
		this.args = args;

		// Actually use the command to drive the character
		this.apply = function () {
			switch (this.name) {
				case "moveBy":
					myPrint("moving " + JSON.stringify(this.args));
					Pather.moveTo(me.x + this.args.x, me.y + this.args.y);
					me.overhead("moveBy " + JSON.stringify(this.args));
					break;

				case "attack":
					var x = this.args.x;
					var y = this.args.y;
					var target = this.args.target;
					var skillId = this.args.skills[0].id;
					myPrint("casting " + JSON.stringify(this.args.skills[0]));
					if (target.unit) {
						target.unit.cast(skillId);
						me.overhead("cast " + skillId + " " + target.x + "," + target.y);
					} else {
						me.cast(skillId, undefined, x, y);
						me.overhead("cast " + skillId + " " + x + "," + y);
					}
					while (me.attacking) {
						delay(10);
					}
					break;

				default:
					break;
			}
		};
	}


// SimulatedUnit is a wrapper around a Unit (or a SimulatedUnit) to work with the genetic algorithm
// so that you can modify properties (position, target, hp etc...) in order to simulate the game without editing Unit instance
	function SimulatedUnit(unit) {
		if (unit.unit) {
			// If unit is a SimulatedUnit, it already has the reference unit
			this.unit = unit.unit;
		} else {
			// If unit is a Unit, reference it
			this.unit = unit;
		}
		this.gid = unit.gid;
		this.classid = unit.classid;
		this.area = unit.area;
		this.x = unit.x;
		this.y = unit.y;
		this.targetx = unit.targetx;
		this.targety = unit.targety;
		this.hp = unit.hp;
		this.hpmax = unit.hpmax;
		this.mp = unit.mp;
		this.mpmax = unit.mpmax;
		this.stamina = unit.stamina;
		this.staminamax = unit.staminamax;
		this.mode = unit.mode;
		this.type = unit.type;
		this.owner = unit.owner;

		switch (unit.type) {
			case sdk.unittype.Player:
				this.walkingYPS = 4; // walking speed yards per second
				this.runningYPS = 6; // running speed yards per second
				this.walkingPPS = 128; // walking speed pixels per second
				this.runningPPS = 192; // running speed yards per second
				this.walkingYPF = 0.16; // walking speed yards per frame
				this.runningYPF = 0.24; // running speed yards per frame
				this.walkingPPF = 5.12; // walking speed pixels per frame
				this.runningPPF = 7.68; // running speed pixels per frame
				this.xsize = 2;
				this.ysize = 2;
				break;

			case sdk.unittype.Monsters:
				this.walkingPPF = GameData.PresetMonsters[unit.classid].Velocity;
				this.runningPPF = GameData.PresetMonsters[unit.classid].Velocity + GameData.PresetMonsters[unit.classid].Run;
				this.walkingPPS = this.walkingPPF * 25;
				this.runningPPS = this.runningPPF * 25;
				this.walkingYPS = this.walkingPPS / 32;
				this.runningYPS = this.runningPPS / 32;
				this.walkingYPF = this.walkingPPF / 32;
				this.runningYPF = this.runningPPF / 32;
				this.xsize = GameData.PresetMonsters[unit.classid].SizeX;
				this.ysize = GameData.PresetMonsters[unit.classid].SizeY;
				break;

			case sdk.unittype.Missiles:
				this.walkingPPF = GameData.MissilesData[unit.classid].Velocity;
				this.runningPPF = GameData.MissilesData[unit.classid].Velocity;
				this.walkingPPS = this.walkingPPF * 25;
				this.runningPPS = this.runningPPF * 25;
				this.walkingYPS = this.walkingPPS / 32;
				this.runningYPS = this.runningPPS / 32;
				this.walkingYPF = this.walkingPPF / 32;
				this.runningYPF = this.runningPPF / 32;
				this.xsize = GameData.MissilesData[unit.classid].Size;
				this.ysize = GameData.MissilesData[unit.classid].Size;
				break;

			default:
				this.walkingYPS = 0;
				this.runningYPS = 0;
				this.walkingPPS = 0;
				this.runningPPS = 0;
				this.walkingYPF = 0;
				this.runningYPF = 0;
				this.walkingPPF = 0;
				this.runningPPF = 0;
				break;
		}
		this.velocityYPFx = (this.targetx - this.x) * (this.mode == 3 ? this.runningYPF : this.walkingYPF);
		this.velocityYPFy = (this.targety - this.y) * (this.mode == 3 ? this.runningYPF : this.walkingYPF);

		// Squared distance to another SimulatedUnit. for performance reason we may need to avoid sqrt.
		this.distance2To = function (other) {
			let x = other.x - this.x;
			let y = other.y - this.y;
			return (x * x) + (y * y);
		};

		this.distanceTo = function (other) {
			return Math.sqrt(this.distance2To(other));
		};

		// Regenerate mana
		// based on http://classic.battle.net/diablo2exp/basics/characters.shtml
		this.regenMana = function (manaRecoveryBonus) {
			var manaPerFrame = Math.floor(Math.floor(256 * this.mpmax / 3000) * (100 + manaRecoveryBonus) / 100) / 256;
			this.mp = Math.min(this.mpmax, this.mp + manaPerFrame);
		};

		// Regenerate life
		// based on http://classic.battle.net/diablo2exp/basics/characters.shtml
		this.regenLife = function (lifeRegenBonus) {
			var lifePerFrame = lifeRegenBonus / 256;
			this.hp = Math.min(this.hpmax, this.hp + lifePerFrame);
		};

		// Regenerate stamina
		// based on http://classic.battle.net/diablo2exp/basics/characters.shtml
		this.regenStamina = function (staminaRegenBonus) {
			var staminaPerFrame = 0;
			// FIXME: use this.mode and this.inTown
			switch (me.mode) {
				case 1: // Player standing outside town
				case 5: // Player standing in town
					staminaPerFrame = Math.floor(this.staminamax * (100 + staminaRegenBonus) / 100) / 256;
					break;

				case 2: // Player walking
					if (me.inTown || this.stamina > 0) {
						staminaPerFrame = Math.floor(Math.floor(this.staminamax / 2) * (100 + staminaRegenBonus) / 100) / 256;
					}
					break;
			}
			this.stamina = Math.min(this.staminamax, this.stamina + staminaPerFrame);
		};

		// Returns the earliest collision that will happen with another SimulatedUnit
		this.collisionWith = function (other) {
			// square distance
			var dist = this.distance2To(other);

			// square sum of radii
			var sr = (this.xsize + other.xsize) * (this.xsize + other.xsize);

			// All values are taken squared to avoid sqrt call for performances

			if (dist < sr) {
				// units are already colliding
				return new Collision(this, other, 0.0);
			}

			// optimizing: unit with same velocity will never collide
			if (this.velocityYPFx == other.velocityYPFx && this.velocityYPFy == other.velocityYPFy) {
				return null;
			}

			// We change the reference coordinates for "other" unit to be at origin (0,0)
			// That way, "other" is not moving
			var x = this.x - other.x;
			var y = this.y - other.y;
			var myp = new Point(x, y);
			var vx = this.velocityYPFx - other.velocityYPFx;
			var vy = this.velocityYPFy - other.velocityYPFy;
			var up = new Point(0, 0)

			// Searching the closest point to "other" (0,0) on the line given by our velocity vector
			var p = up.closestPointOnLine(myp, new Point(x + vx, y + vy));

			// squared distance between "other" and the closest point on line
			var pdist = up.distance2To(p);

			// squared distance between "this" and the closed point on line
			var mypdist = myp.distance2To(p);

			// If distance between "other" and this line is lower than radii sum, there may be a collision
			if (pdist < sr) {
				// our speed on the line
				var length = Math.sqrt(vx * vx + vy * vy);

				// we move the point on the line to find the impact point
				var backdist = Math.sqrt(sr - pdist);
				p.x = p.x - backdist * (vx / length);
				p.y = p.y - backdist * (vy / length);

				// If the point is further than previously, our speed is not in the right direction
				if (myp.distance2To(p) > mypdist) {
					return null;
				}

				pdist = p.distanceTo(myp);

				// impact point is further than what we can move in a frame time
				if (pdist > length) {
					return null;
				}

				// Needed time to reach impact point
				var t = pdist / length;

				return new Collision(this, other, t);
			}

			return null;
		};

		// Move a unit along its velocity vector by the given time
		// t the relative time to move. Usefull to calculate collisions
		this.move = function (t = 1) {
			this.x += this.velocityYPFx * t;
			this.y += this.velocityYPFy * t;
		};

		// End the simulation by rounding values
		this.end = function () {
			this.x = this.x | 0;
			this.y = this.y | 0;
			this.hp = this.hp | 0;
			this.mp = this.mp | 0;
			this.stamina = this.stamina | 0;
		};
	}


// A GameState stores all the data you need to simulate the game (monsters, missiles, players, presets etc...)
	function GameState(player, monsters, missiles) {
		this.player = player;
		this.monsters = monsters;
		this.missiles = missiles;

		// Simulate a command and return a new GameState after simulation
		// This is the critical part of the Genetic Algorithm.
		// The closer state we can simulate from the real game engine, the better the Genetic Algorithm will be
		this.simulate = function (command) {
			for (var i = 0; i < this.monsters.length; i++) {
				//TODO if monter is close to player, target it so it moves toward the player (simulate monster attacking player)
				this.monsters[i].move();
				this.monsters[i].end();
			}

			// Move the missiles
			for (var i = 0; i < this.missiles.length; i++) {
				this.missiles[i].move();
				this.missiles[i].end();
			}

			switch (command.name) {
				case "moveBy":
					var newPlayer = new SimulatedUnit(this.player);
					newPlayer.targetx = command.args.x;
					newPlayer.targety = command.args.y;
					newPlayer.move();

					newPlayer.regenMana(me.getStat(27));
					newPlayer.regenLife(me.getStat(74));
					newPlayer.regenStamina(me.getStat(28));

					newPlayer.end();

					var newMonsters = this.monsters;
					var newMissiles = this.missiles;

					return new GameState(newPlayer, newMonsters, newMissiles);

				case "attack":
					var x = command.args.x;
					var y = command.args.y;
					var target = new SimulatedUnit(command.args.target);
					var skills = command.args.skills;
					var newMonsters = this.monsters;
					var newMissiles = this.missiles;
					var newPlayer = new SimulatedUnit(this.player);

					var manaCost = Skill.getManaCost(skills[0].id);
					if (newPlayer.distanceTo(target) <= Skills.range[skills[0].id] && newPlayer.mp >= manaCost) {
						var targetHPPercent = target.hp * 100 / target.hpmax;
						var minDmg = Math.max(skills[0].pmin, skills[0].min);
						var maxDmg = Math.max(skills[0].pmax, skills[0].max);
						var averageDmg = (minDmg + maxDmg) / 2;
						var targetMaxHP = GameData.monsterMaxHP(target.classid, target.area);
						var targetRealHP = targetMaxHP * targetHPPercent / 100;
						targetRealHP -= averageDmg;
						var newHp = targetRealHP / targetMaxHP * target.hpmax;
						target.hp = newHp;
						newPlayer.mp -= manaCost;
						newMonsters = newMonsters.map(m => (m.gid == target.gid) ? target : m).filter(m => m.hp > 0);
					}

					newPlayer.regenMana(me.getStat(27));
					newPlayer.regenLife(me.getStat(74));
					newPlayer.regenStamina(me.getStat(28));

					newPlayer.end();

					return new GameState(newPlayer, newMonsters, newMissiles);

				case "none":
					return this;

				default:
					myPrint("Unknown command '" + command.name + "' (" + JSON.stringify(command.args) + ")");
					return this;
			}
		};

		// Calculates the fitness of the current game state with the given command.
		// The command should not be needed.
		this.calculateFitness = function (command) {
			var numberOfMonsters = this.monsters.length;
			if (numberOfMonsters == 0) {
				return 1;
			}

			var manaFactor = 0.05;
			var monsterHPFactor = 1000;
			var playerHPFactor = 1;
			var averageDistanceFactor = 0.5;
			var closestDistanceFactor = 0.5;
			var numberOfMonstersFactor = 1000;
			var attackDmgFactor = 200;

			var closestMonster;
			var closestDistance = 1000;
			var totalDistance = 0;
			var totalMonstersHP = 0;

			for (var m of this.monsters) {
				var distance = this.player.distanceTo(m);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestMonster = m;
				}
				if (distance <= 2) {
					this.player.hp -= 10; // TODO: get dmg of monster based on his attack range
				}
				totalDistance += distance;
				totalMonstersHP += m.hp * 100 / m.hpmax;
			}

			var enemiesMissiles = this.missiles.filter(m => {
				var parent = getUnit(sdk.unittype.Monsters, null, null, m.owner);
				if (parent) {
					return GameData.isEnemy(parent);
				}
				return false;
			});
			for (var m of enemiesMissiles) {
				var collision = m.collisionWith(this.player);
				if (collision) {
					var framesBeforeCollision = collision.time * Math.sqrt(m.velocityYPFx * m.velocityYPFx + m.velocityYPFy * m.velocityYPFy);
					var realFCR = me.getStat(105) - Config.FCR;
					if (framesBeforeCollision <= realFCR) {
						this.player.hp -= 10; // TODO: get dmg of missile
					}
				}
			}


			var averageDistance = totalDistance / numberOfMonsters;
			var hpPerMonsters = totalMonstersHP / numberOfMonsters;
			/*var monstersMeanPosition = this.monsters.reduce((position, m) => {
				position.x += m.x;
				position.y += m.y;
				return position;
			}, {x:0, y:0});
			monstersMeanPosition.x /= numberOfMonsters || 1;
			monstersMeanPosition.y /= numberOfMonsters || 1;*/
			var playerHPPercent = this.player.hp * 100 / this.player.hpmax;
			if (playerHPPercent <= Config.LifeChicken) {
				return 0;
			}
			var manaPercent = this.player.mp * 100 / this.player.mpmax;

			var fitness = 0;

			fitness += Math.sqrt(numberOfMonsters) * numberOfMonstersFactor; // more monsters, worst fitness
			fitness += Math.sqrt(hpPerMonsters) * monsterHPFactor; // more monsters hp, worst fitness
			//fitness += Math.sqrt(closestDistance) * 1/closestDistanceFactor;
			fitness += Math.pow(averageDistance, 2) * averageDistanceFactor; // closer monsters, worst fitness (depend on character and gameplay)
			//fitness += playerHPPercent * playerHPFactor;
			fitness += Math.sqrt(manaPercent) * manaFactor; // less mana, worst fitness

			fitness /= playerHPPercent * playerHPFactor; // less hp, worst fitness

			// inverse fitness = the higher is fitness, the worst this game state is
			if (fitness == 0) {
				return 1;
			}
			return 1 / fitness;
		};

		this.debugString = function () {
			var log = "\n======= GameState =======\n";
			log += "  player : " + JSON.stringify(this.player) + "\n";
			log += "  monsters : " + this.monsters.length + "\n";
			log += this.monsters.map(m => "    ■ " + JSON.stringify(m) + "\n");
			log += "===== End GameState =====\n";
			return log;
		};
	}


	let possibleMoves = [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];

	function generateRandomGene(gameState) {
		return randomCommand(gameState);
	}

	function randomCommand(gameState) {
		var possibleCommandNames = ["moveBy", "none"];
		var monsters = [];
		if (gameState) {
			monsters = gameState.monsters;
		}
		if (monsters.length > 0) {
			// twice chance of attacking
			possibleCommandNames.push("attack", "attack");
		}
		var name = possibleCommandNames.random();
		var args = {};
		switch (name) {
			case "moveBy":
				args = {x: possibleMoves.random(), y: possibleMoves.random()};
				break;

			case "attack":
				var targetMonster = monsters.sort((m1, m2) => {
					return gameState.player.distanceTo(m1) * m1.hp * 100 / m1.hpmax - gameState.player.distanceTo(m2) * m2.hp * 100 / m2.hpmax;
				}).first();

				//TODO get all monsters potentially hit by skill

				var skills = GameData.allSkillDamage(targetMonster);
				var skillsArray = Object.keys(skills)
					.map(s => skills[s]);
				skillsArray.forEach((s, i) => s.id = parseInt(Object.keys(skills)[i]));
				skillsArray = skillsArray.filter(s => !isNaN(s.id) && (s.pmin > 0 || s.pmax > 0 || s.min > 0 || s.max > 0))
					.filter(s => Skill.getManaCost(s.id) <= gameState.player.mp)
					.sort((s1, s2) => (Math.max(s2.pmin, s2.min) + Math.max(s2.pmax, s2.max)) / 2 - (Math.max(s1.pmin, s1.min) + Math.max(s1.pmax, s1.max)) / 2);
				args = {
					skills: [skillsArray.first(), skillsArray.first()],
					x: targetMonster.x,
					y: targetMonster.y,
					target: targetMonster
				};
				break;

			default:
				break;
		}
		return new Command(name, args);
	}

	function getMonsters() {
		return getUnits(sdk.unittype.Monsters)
			.compactMap(u => u)
			.filter(u => GameData.isEnemy(u)).map(u => new SimulatedUnit(u));
	}

	function getMissiles() {
		return getUnits(sdk.unittype.Missiles)
			.compactMap(m => new SimulatedUnit(m));
	}

	function getEnemiesMissiles() {
		return getMissiles()
			.filter(u => {
				var parent = getUnit(sdk.unittype.Monsters, null, null, u.owner);
				if (parent) {
					return GameData.isEnemy(parent);
				}
				return false;
			});
	}

	function getMyMissiles() {
		return getMissiles()
			.filter(u => u.ownertype == sdk.unittype.Player);
	}


	const PRINT = false;

	function myPrint(args) {
		if (PRINT) {
			print(args);
		}
	}

	function Point(x, y) {
		this.x = x;
		this.y = y;

		this.closestPointOnLine = function (a, b) {
			var da = b.y - a.y;
			var db = a.x - b.x;
			var c1 = da * a.x + db * a.y;
			var c2 = -db * this.x + da * this.y;
			var det = da * da + db * db;
			var cx = 0;
			var cy = 0;

			if (det != 0) {
				cx = (da * c1 - db * c2) / det;
				cy = (da * c2 + db * c1) / det;
			} else {
				// I'm already on line
				cx = this.x;
				cy = this.y;
			}

			return new Point(cx, cy);
		};

		this.distance2To = function (other) {
			let x = other.x - this.x;
			let y = other.y - this.y;
			return (x * x) + (y * y);
		};

		this.distanceTo = function (other) {
			return Math.sqrt(this.distance2To(other));
		};
	}

	function Collision(u1, u2, time) {
		this.u1 = u1;
		this.u2 = u2;
		this.time = time;
	}
	return GeneticAlgorithmAttack;
}).call(null, require("GameData"), require('Skills'), require('Config'));