/**
 * @description Automaticly skilling / stating based on the build you have
 * @author jaenster
 */


(function (module, require) {

	const Worker = require('../../../modules/Worker');
	const Config = require('../AutoConfig/Config');

	const getCurrentBuild = (() => {
		let __cache, cachedLvl = me.charlvl;
		const handler = function () {
			if (!__cache) { // generate cache
				print('cache builds');
				__cache = Config.builds.find(build => build.hasOwnProperty('active') && build.hasOwnProperty('valid') && build.valid() && build.active());
				cachedLvl = me.charlvl;
			}
			return __cache;
		};
		handler.resetCache = () => __cache = undefined; // accessible to the outside as getCurrentBuild.resetCache()
		return handler;
	})();

	Worker.runInBackground.autoStatSkill = (new function () {
		let build ={};

		const run = [
			// credits to dzik for the original code
			function stat() {
				const checkStat = (stat, items) => {
					let bonus = 0,i;
					for (i = 0; i < items.length; i++) {
						bonus += items[i].getStatEx(stat);
					}
					return me.getStat(stat) - bonus;
				};


				// Stat the char to a specified build. Thanks dzik <3
				var i, j, points, stat, items, charms, one, before, tick,
					missing = [0, 0, 0, 0],
					send = [0, 0, 0, 0],
					names = ["strength", "energy", "dexterity", "vitality"];

				if (!me.ingame || !me.getStat(4)) {
					return; // Pointless to check without points or when we are not in game
				}
				points = me.getStat(4); // how many points we can use.

				// Get items
				items = me.findItems(null, 1, 1); // mode 1 = equipped, location 1 = body

				// In case of xpac we want to look for charms too (they can give +str/dex)
				if (!!me.gametype) { // expansion
					for (j = 603; j <= 605; j++) { // charms in inventory
						charms = me.findItems(j, null, 3);
						if (!!charms.length) items = items.concat(charms);
					}
				}

				// check for the stats at the items
				for (i = 0; i < 4; i++) {
					stat = checkStat(i, items);
					if (stat < build.stats[names[i]][0]) {
						missing[i] = build.stats[names[i]][0] - stat;
					}
				}

				while (!!points) { // in case we have more than one level at once.
					for (i = 0; i < 4; i++) {
						one = Math.max(Math.min(build.stats[names[i]][1], missing[i] - send[i], points), 0);
						send[i] += one;
						points -= one;
					}
				}
				for (i = 0; i < 4; i++) {
					if (send[i] > 32) { // i cannot explain that ...
						points += send[i] - 32;
						send[i] = 32;
					}
				}

				// Actually send the right packet to do so
				for (i = 0; i < 4; i++) {
					if (!send[i]) {
						continue; // No need to stat this
					}
					before = me.getStat(i);
					sendPacket(1, 0x3A, 1, i, 1, send[i] - 1); // <3 dzik

					tick = getTickCount();
					while (true) {
						if (getTickCount() - tick > 1e4) {
							return;
						}
						if (before < me.getStat(i)) {
							console.debug("Added +" + send[i] + " to " + names[i]);
							break;
						}
						delay(200);
					}
				}
			},
			function skill() {


				if (getUIFlag(0x17)) return; // cant skill while in trade

				const getPrerequisites = (skId) => [183, 182, 181].map(item => getBaseStat('skills', skId, item)).filter(el => el > 0 && el < 356 && !me.getSkill(el, 0));

				// Build skills based upon build
				const skills = build.skills;
				const availablePoints = me.getStat(5);
				let found = 0, parent = 0, goal = 0;


				availablePoints && skills.some(function testSkill([skId, wanted, skIdParent]) {
					if (found) return found; // continue with that one

					let currentPoints = me.getSkill(skId, 0);

					if (currentPoints >= 20) return false; // cant skill more sadly

					// Already at the wanted level
					if (currentPoints >= wanted) return false;

					// level requirements, or
					// cant put more skills in it currently due to lvl (you cant put 2 orb at lvl 30)
					//ToDo; if we 1 level of the skill check the prerequisites (so skill telekinesis at lvl 17, for example)
					if (getBaseStat('skills', skId, 176) + currentPoints > me.charlvl) return false;

					// do we need to skill a prerequisite first?
					let prerequisites = getPrerequisites(skId);

					// recursively call this skill (a prerequisite can need a prerequisite
					if (prerequisites.length) return found = testSkill([prerequisites.first(), 1/* we need atleast 1*/, skIdParent || skId]);

					// do we need
					parent = skIdParent;
					goal = wanted;

					return found = skId;
				}, 0);

				if (found) {
					// We found a skill we wanna spend a point in.
					if (parent) {
						console.debug('Skilling ' + getSkillById(found) + ' as prerequisites of ' + getSkillById(parent));
					} else {
						console.debug('Skilling ' + getSkillById(found) + ' (' + (me.getSkill(found, 0) + 1) + '/' + goal + ')');
					}
					useSkillPoint(found);
					delay(200);
				}
			}
		];

		return {
			update: () => {
				build = getCurrentBuild();
				run.some(_ => _());
				return true;
			}
		}
	}).update;

	module.exports = {
		getCurrentBuild: getCurrentBuild, // so we can reset the cache
	}

})(module, require);