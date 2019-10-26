/**
 * @description Automaticly figure out who bo's and all
 * @author Jaenster
 * @config, just "require('AutoBo');" in your config
 */



(function (module, require) {

	// Only do this for the main thread
	if (getScript(true).name.toLowerCase() !== 'default.dbj') return;

	// ToDo; get the area location of all bots
	const workArea = sdk.areas.CatacombsLvl4;


	const Skills = require('Skills');
	const Worker = require('Worker');
	const GameEvent = require('GameEvent');
	const Precast = require('Precast');
	const Promise = require('Promise');
	const Town = require('Town');

	GameEvent.on('quit', function (name, account) { // Remove member from list
		const member = Object.keys(Members).indexOf(name);
		if (member > -1) delete Members[member];
	});

	// Broadcast our self when a new player joins the game
	GameEvent.on('join', () => hi());


	const Members = {};
	Members[me.charname] = {
		name: me.charname,
		boLvl: Skills.getSkillLevel(sdk.skills.BattleOrders).sort((a, b) => b - a).first(),
		profile: me.windowtitle,
	};

	const Team = require('Team');
	Team.on('AutoBo', data => {
		if (data.hasOwnProperty('hi') && data.hi.hasOwnProperty('name') && data.hi.hasOwnProperty('boLvl') && data.hi.hasOwnProperty('profile')) {
			if (typeof Members[data.hi.name] === 'undefined') Members[data.hi.name] = {};
			Object.keys(data.hi).forEach(key => Members[data.hi.name][key] = data.hi[key]); // Store info
		}
		if (data.hasOwnProperty('want') && data.want.hasOwnProperty('name') && data.want.hasOwnProperty('boLvl') && data.want.hasOwnProperty('profile')) {
			// Someone wants an bo of me. (s)he can get it.
			moveToArea(() => {
				while (!getUnit(sdk.unittype.Player, data.want.name)) delay(3);
				const skills = [sdk.skills.BattleCommand, sdk.skills.BattleOrders, sdk.skills.Shout];
				Skills.getSkillLevel(sdk.skills.Shout).sort((a, b) => b - a).first() === 0 && skills.pop(); // remove shout if we dont have it
				Precast(skills);
			})
		}
	});

	const hi = () => Team.broadcastInGame({
		AutoBo: {
			hi: {
				name: me.charname,
				boLvl: Skills.getSkillLevel(sdk.skills.BattleOrders),
				profile: me.windowtitle,
			}
		}
	});
	hi();

	const moveToArea = (doWhat) => {
		let [area, x, y] = [me.area, me.x, me.y];
		Pather.goToTown();
		let townArea = me.area;
		Pather.useWaypoint(workArea);
		doWhat();
		Pather.useWaypoint(townArea);
		if (townArea !== area) {
			Town.moveTo('portal');
			Pather.usePortal(area, me.name);
			Pather.moveTo(x, y);
		}
	};

	Worker.runInBackground.AutoBo = (new function () {
		function goBo() {
			// Calculate the highest bo-er
			const giver = Object.keys(Members).reduce((highest, current) => {
				if (highest === null) return current;
				return highest.boLvl < current.boLvl && current || highest;
			}, null);

			// It appears i give the highest bo, so do it ourselves.
			if (giver === Members[me.charname]) return (!me.inTown && (Precast() || true))
				|| (me.inTown && Precast.outTown((currentArea => () => Pather.useWaypoint(currentArea))(me.area)) || true)

			// Send the bo-er
			Team.send(giver.profile, {AutoBo: {want: Members[me.charname]}});

			// Listen once on the response
			Team.once('AutoBo', function (data) {
				if (data.hasOwnProperty('ok') && data.hasOwnProperty('area') && data.ok.hasOwnProperty('name') && data.ok.hasOwnProperty('boLvl') && data.ok.hasOwnProperty('profile')) {
					moveToArea(() => {
						//wait for an bo
						while (me.getState(sdk.states.BattleOrders)) delay(3);
					});
				}
			});

			// Request for an bo
			return resolved = !(new Promise(resolve => me.getState(sdk.states.BattleOrders) && me.getState(sdk.states.BattleCommand) && resolve()).then(() => resolved = true));
		}

		let resolved = true;
		this.update = function () {
			if (resolved && !me.getState(sdk.states.BattleOrders) || !me.getState(sdk.states.BattleCommand)) goBo();
			return true; // keep on checking
		}
	}).update;


}).call(this/*globalscope*/, module, require);