/**
 * @description An libary to mock an player.
 * @author Jaenster
 */


(function (module, require) {

	/** @class MockItem */
	const MockItem = require('MockItem');
	const Skills = require('Skills');

	function MockPlayer(settings) {
		Object.keys(settings).forEach(key => this[key] = settings[key]);
		const getTotal = (...args) => {
			const onMe = this.getStat.apply(this, args);
			const onItems = settings.gear.reduce((a, c) => a + (c.getStat.apply(c, args) || 0), 0);
			return onMe + onItems;
		};
		Object.defineProperties(this, {
			maxhp: {
				get: function () {
					return getTotal(sdk.stats.Maxhp) * (1 + (getTotal(sdk.stats.MaxhpPercent) / 100));
				}
			},
			maxmp: {
				get: function () {
					return getTotal(sdk.stats.Maxmana) * (1 + (getTotal(sdk.stats.MaxmanaPercent) / 100));
				}
			},
		});

		const softSkills = skillId => {
// soft skills
			const classType = Skills.class[skillId];
			const tabType = Skills.tab[skillId];
			const ignoreSlots = [[sdk.body.LeftArmSecondary, sdk.body.RightArmSecondary], [sdk.body.LeftArm, sdk.body.RightArm]][this.weaponswitch];

			let oSkillOrDirect = false;
			return [this.gear.reduce((acc, item) => {
				const directSkills = item.getStat(sdk.stats.Singleskill, skillId) || 0;
				const oSkills = (item.getStat(sdk.stats.Nonclassskill, skillId) || 0);
				const classSkills = item.getStat(sdk.stats.Addclassskills, this.classid) || 0;
				const tabSkills = item.getStat(sdk.stats.AddskillTab, tabType) || 0;
				const allSkills = (item.getStat(sdk.stats.Allskills) || 0);
				// Check if its on our "other" slot, so we cant calculate its skill
				if (item.location === sdk.storage.Equipment && ignoreSlots.includes(item.bodylocation)) {
					return acc;
				}

				let total = 0;

				// If this skillId, is part or our class,
				if (classType === this.classid) {
					// We can use direct skills
					total += directSkills;

					// We can use class skills aswell
					total += classSkills;

					// And the tab skills
					total += tabSkills;
				}

				// oskills always work no matter the class
				total += oSkills;

				// And "all skills" work on all ;)
				total += allSkills;

				oSkillOrDirect |= (!!directSkills || !!oSkills);
				return acc + total;
			}, 0), oSkillOrDirect];

		};

		this.getSkill = (...args) => {
			const [skillId, type] = args;
			if (type === undefined) {
				switch (skillId) {
					case 0: // right hand skill?
					case 1: // left hand skill?
					case 2: // ?
					case 3:	// ?
						break;
					case 4:// ?
						//ToDo; fix for items
						const build = [];
						for (let i = 0; i < 281; i++) {
							let skillLvl = this.getSkill(i, 1);
							skillLvl && build.push([i, this.getSkill(i, 0), skillLvl])
						}
						return build;
					default:
						break; // just return all the skills the player has
				}
			}

			const hardskills = (this.overrides.skill.find(([skill]) => skill === skillId) || [skillId, 0])[1];
			if (!type) return hardskills;
			if (type === 1) {
				// If we dont own the skill, we cant count the plus skills
				const [soft, oSkillOrDirect] = softSkills(skillId);

				if (!hardskills && !oSkillOrDirect) return 0;// Nothing gives us the initial + skill
				return soft + hardskills;
			}
		};

		const requiredSkills = skillId => [sdk.stats.PreviousSkillLeft, sdk.stats.PreviousSkillMiddle, sdk.stats.PreviousSkillRight]
			.map(type => getBaseStat("skills", skillId, type))
			.filter(preSkillId => preSkillId !== 0xFFFF && !this.getSkill(preSkillId, 0));

		this.statSkill = skillId => {
			// Get the class type
			if (this.classid !== Skills.class[skillId]) return false; // Wrong class

			// Level you need to be, to skill this skill
			const conversionLevel = getBaseStat("skills", skillId, sdk.stats.ConversionLevel);


			// Is our lvl high enough to skill it?
			if (this.charlvl < conversionLevel) return false;

			// Is it allowed to skill this?
			// For example, your lvl 30 and want to put a second point in frozen orb. This isnt allowed
			if ((this.charlvl + 1 - conversionLevel) === this.getSkill(skillId, 0)) return false;

			// Do we need a pre-skill first?
			if (requiredSkills(skillId).length) return false;

			// print('Mock Skilling: ' + getSkillById(skillId));
			const found = this.overrides.skill.findIndex(([i, h, s]) => i === skillId);
			if (found > -1) {
				// Already skilled this, so, just add it
				let [i, h] = this.overrides.skill[found];
				h++; // add a skill
				this.overrides.skill[found] = [i, h]
			} else { // We didnt got this skill yet
				this.overrides.skill.push([skillId, 1])
			}
		};

		this.getState = () => false; // we dont have any state ever, just for testing purposes

		this.getStat = function (...args) {
			const items = this.gear.reduce((a, c) => a + (c.getStat.apply(c, args) || 0), 0);
			const [major, minor] = args;
			const getStat = () => {
				const found = this.overrides.stat.find(data => data.length > 2 && data[0] === major && data[1] === (minor || 0));
				if (found) return found[2]; // the value
				return 0;
			};
			return items + (getStat() || 0);
		}
	}


	MockPlayer.fromUnit = function (unit = me, settings = {}) {
		const gear = settings.gear = MockItem.fromGear(); // get Gear
		Object.keys(unit).forEach(key => typeof unit[key] !== 'function' && typeof unit[key] !== 'object' && (settings[key] = unit[key]));

		const states = [];
		for (let x = 0; x < 358; x++) {
			const zero = me.getStat(x, 0);
			zero && states.push([x, 0, zero]);
			for (let y = 1; y < 281; y++) {
				const second = me.getStat(x, y);
				second && second !== zero && states.push([x, y, second]);
			}
		}
		const skills = me.getSkill(4).map(data => {
			// We need to just store the amount of harded skills
			return [data[0], data[1]];
		}).filter(data => data[1]); // only those the char actually has


		settings.overrides = {
			stat: states.map(stat => {
				const [major, minor, value] = stat;

				let gearStats = gear.reduce((acc, item) => acc + (item.getStat(major, minor) || 0), 0);
				let realValue;

				if ([sdk.stats.Maxhp, sdk.stats.Maxmana].includes(major)) {
					gearStats /= 256;
					const procentName = sdk.stats[Object.keys(sdk.stats).find(key => sdk.stats[key] === major) + 'Percent'];
					const otherStats = gear.reduce((acc, item) => acc + (item.getStat(procentName, minor) || 0), 0);

					// For max hp, we need to first remove the % life modifiers
					realValue = value / (100 + otherStats) * 100;

					// After that, we need to remove the remaining life given by items
					realValue -= gearStats;
				} else {
					realValue = value - gearStats;
				}
				return [major, minor, realValue];
			}).filter(x => x[2] && x[2] > 0),
			skill: skills,
		};
		return new MockPlayer(settings);
	};

	module.exports = MockPlayer;
}).call(null, module, require);