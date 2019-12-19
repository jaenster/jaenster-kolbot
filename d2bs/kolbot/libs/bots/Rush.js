/**
 * @description A single script for both the rush as the rusher
 *
 */

(function (module, require) {

	const sequence = [
		// Act one
		sdk.quests.SistersToTheSlaughter,
		sdk.quests.AbleToGotoActII,

		// Act two
		sdk.quests.TheTaintedSun,
		sdk.quests.TheHoradricStaff,
		sdk.quests.TheArcaneSanctuary,
		sdk.quests.TheSummoner,
		sdk.quests.TheSevenTombs,
		sdk.quests.AbleToGotoActIII,

		// Act three
		sdk.quests.TheBlackenedTemple, // travincal
		sdk.quests.TheGuardian,  // mephisto
		sdk.quests.AbleToGotoActIV,

		// Act four
		sdk.quests.TerrorsEnd,
		// Expansion
		sdk.quests.AbleToGotoActV,

		// Act 5,
		sdk.quests.PrisonOfIce, // anya
		sdk.quests.RiteOfPassage,
		sdk.quests.EveOfDestruction,
	];


	const rush = function (Config, Attack, Pickit, Pather, Town, Misc) {
		Object.defineProperties(this, {
			leader: {
				get: () => Object.keys(TeamData)
					.filter(key => TeamData[key].hasOwnProperty('highestRushQ')) /* Filter out those that dont know which q is highest*/
					.sort((a, b) => (TeamData[b].highestRushQ || 0) - (TeamData[a].highestRushQ || 0)) /* sort on highest q done*/
					.first(),
			},
			isLeader: {get: () => this.leader === me.charname && Object.keys(TeamData).length > 1},
			highestRushQ: {get: () => sequence.map(_ => _).reverse().find(q => me.getQuest(q, 0)) || 0},
			safe: {
				get: () => safePortalArea,
				set: () => Team.broadcastInGame({Rush: {safe: me.area}}),
			},
			done: {
				get: () => doneArea === me.area,
				set: () => Team.broadcastInGame({Rush: {done: me.area}}),
			}
		});
		const Delta = new (require('Deltas'));
		const TeamData = {};
		const Quest = require('QuestEvents');
		TeamData[me.charname] = {
			highestQuestDone: me.highestQuestDone || 0,
			highestAct: me.highestAct || 1,
			highestRushQ: this.highestRushQ || 0,
		};

		const Team = require('Team');
		const myData = () => ({Rush: {player: {data: TeamData[me.charname], name: me.charname}}});
		const requestData = () => Team.broadcastInGame({Rush: {request: true}});
		Team.on('Rush', data => {

			if (data.hasOwnProperty('player') && typeof data.player === 'object' && typeof data.player.data === 'object' && data.player.hasOwnProperty('name')) {
				// If no data of player is known yet
				if (!TeamData.hasOwnProperty(data.player)) TeamData[data.player.name] = {};

				Object.keys(data.player.data).forEach(key => TeamData[data.player.name][key] = data.player.data[key]);
			}

			if (data.hasOwnProperty('request')) data.reply(myData());

			if (data.hasOwnProperty('doQuest')) questWorkBench.push(data.doQuest);

			if (data.hasOwnProperty('safe')) {
				print('Area safe: ' + safePortalArea);
				safePortalArea = data.safe;
			}

			if (data.hasOwnProperty('done')) doneArea = data.done;
		});

		let safePortalArea = 0, doneArea = 0;
		const questWorkBench = [];
		let currentQuest = '';
		let inQuest = false;
		Delta.track(() => JSON.stringify(TeamData[me.charname]), () => Team.broadcastInGame(myData())); // If something changes in my data, send it to the rest
		Delta.track(() => me.area, (o, n) => TeamData[me.charname].area = me.area); // Let the team know where i'm at
		Delta.track(() => questWorkBench.length, () => {
			if (!questWorkBench.length) return;
			currentQuest = questWorkBench.shift();
			if (inQuest) throw Error('In quest');
		});

		const getQuestItem = function (classId, chestId) {
			let tick = getTickCount();

			if (me.getItem(classId)) {
				return true;
			}

			if (me.inTown) return false;

			let chest = getUnit(2, chestId);

			if (!chest) {
				return false;
			}

			Misc.openChest(chest);
			let item;
			while (!(item = getUnit(4, classId)) && getTickCount() - tick < 1000) delay(30);

			if (!item) return false;
			return Pickit.pickItem(item) && delay(1000);
		};

		// Fields of me to track
		['highestAct', 'highestQuestDone'].forEach(key => Delta.track(() => me[key], (o, n) => TeamData[me.charname][key] = n || 0));

		Team.broadcastInGame(myData()); // send my data
		requestData();// ask data of other players once we are up

		const WaitOnLeadersPortal = (area) => {
			print('Waiting for portal of leader');
			Town.goToTown(sdk.areas.townOf(area)).move('portalspot');
			while (me.area !== area) {
				while (this.safe !== area) delay(100);
				// print('Taking portal! -> ' + this.leader + ' -> ' + area);
				let portal = getUnits(2, 'portal').filter(portal => portal.objtype === area).first();
				portal && portal.click();
			}
			return me.area === area
		};
		const WaitOnDone = (area = me.area) => {
			print('Wait until done');
			while (area !== doneArea) delay(100);
			!me.inTown && Pather.usePortal(null, this.leader);
		};

		const talkTo = function (name, cancel = false) { // Credit to Jean Max for this function: https://github.com/JeanMax/AutoSmurf/blob/master/AutoSmurf.js#L1346
			let npc, i;

			!me.inTown && Town.goToTown();

			for (i = 5; i; i -= 1) {
				Town.move(name === "jerhyn" ? "palace" : name);
				npc = getUnit(1, name === "cain" ? "deckard cain" : name);
				if (npc && npc.openMenu()) {
					cancel && me.cancel();
					return true;
				}
				Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
			}

			return false;
		};

		const handlers = {
			SistersToTheSlaughter: {
				leader: () => {
					print('Killing andy');
					Pather.journeyTo(sdk.areas.CatacombsLvl4); // Going to catacombs 4.
					const [x, y] = [me.x, me.y];
					Pather.makePortal();
					me.clear(15); // clear around this area
					this.safe = true;
					Pather.moveTo(22549, 9520);
					const andy = getUnit(1, sdk.monsters.Andariel); // Andariel
					if (!andy) throw new Error('Andariel not found');
					andy.kill();
					this.done = true;
					Pather.moveTo(x, y);
					Pather.usePortal(null, me.charname); // take my portal back to town
				},
				follower: function (leader) {
					print('Doing andy!');
					WaitOnLeadersPortal(sdk.areas.CatacombsLvl4);
					WaitOnDone(sdk.areas.CatacombsLvl4);
					talkTo('Warriv'); // Just talk to warriv
				},
			},
			AbleToGotoActII: {
				leader: () => {
				},
				follower: function (leader) {
					talkTo('Warriv');
					Misc.useMenu(sdk.menu.GoEast);
				},
			},
			TheTaintedSun: {
				leader: () => {
					Pather.journeyTo(sdk.areas.ClawViperTempleLvl2);
					Pather.moveTo(15049, 14051);
					this.safe = true;
					this.done = true;
					Pather.makePortal(true);
				},
				follower: function (leader) {
					Town.move('drognan'); // To prepair to be talking with drogan
					while (TeamData[leader].area !== sdk.areas.ClawViperTempleLvl2) delay(10);
					talkTo('drognan');
					WaitOnLeadersPortal(sdk.areas.ClawViperTempleLvl2);
					getQuestItem(521, 149); // ToDo; make sdk for this
					WaitOnDone(sdk.areas.ClawViperTempleLvl2);
					talkTo('cain');
				},
			},
			TheHoradricStaff: {
				leader: () => {
					Pather.journeyTo(sdk.areas.MaggotLairLvl3);
					Pather.moveToPreset(me.area, 2, 356);
					let portal = Pather.makePortal();
					me.clear(30);
					portal.moveTo();
					let chest = getUnit(2, 356);
					// Open chest already
					if (chest && !chest.mode) me.getSkill(sdk.skills.Telekinesis, 1) && chest.cast(sdk.skills.Telekinesis) || Misc.openChest(chest);
					this.safe = true;
					this.done = true;
					Pather.usePortal(undefined, undefined, portal);
				},
				follower: function (leader) {
					WaitOnLeadersPortal(sdk.areas.MaggotLairLvl3);
					getQuestItem(92, 356); // ToDo; make sdk for this
					WaitOnDone(sdk.areas.MaggotLairLvl3);
					talkTo('Cain');
					Town.move('stash');
				},
			},
			TheArcaneSanctuary: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			TheSummoner: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			TheSevenTombs: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			AbleToGotoActIII: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			TheBlackenedTemple: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			TheGuardian: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			AbleToGotoActIV: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			TerrorsEnd: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			AbleToGotoActV: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			PrisonOfIce: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			RiteOfPassage: {
				leader: () => {
				},
				follower: function (leader) {
				},
			},
			EveOfDestruction: {
				leader: () => {
				},
				follower: function (leader) {
				},
			}
		};

		// If we are the designated leader, we want to do the next quest
		// Delta.track(() => this.isLeader && currentQuest,()=> Team.broadcastInGame({Rush: {doQuest: currentQuest}}));
		Delta.track(() => {
			if (!this.isLeader) return false;
			const lastQ = Math.min.apply(null, Object.keys(TeamData).map(key => TeamData[key].highestQuestDone || 0));
			// So lets find next q
			let nextQuestIndex = sequence.findIndex(e => lastQ === e) + 1;
			if (sequence.hasOwnProperty(nextQuestIndex) && currentQuest !== sequence[nextQuestIndex]) {
				currentQuest = sequence[nextQuestIndex];
			}
			return currentQuest;
		}, (o, n) => n && Team.broadcastInGame({Rush: {doQuest: currentQuest}}));

		// For debug purposes
		// Delta.track(() => JSON.stringify(TeamData), () => print(TeamData));

		const currentQuestName = () => Object.keys(sdk.quests).find(key => sdk.quests[key] === currentQuest);
		while (true) {
			delay(1000);
			const [leader, isLeader, doQuest] = [this.leader, this.isLeader, currentQuestName()];
			if (leader === me.charname && !isLeader) continue; // Waiting for now
			print('Leader = ' + leader);
			print('isLeader = ' + isLeader);
			print('doQuest = ' + doQuest);
			print(TeamData);


			if (!doQuest) continue; // Wait for quest

			print('Doing quest: ' + doQuest);
			if (handlers.hasOwnProperty(doQuest)) {
				handlers[doQuest][isLeader && 'leader' || 'follower'](leader);
			}
			print('Waiting for next quest...');
			while (doQuest === currentQuestName()) {
				delay(1000);
			}
			print('Next quest!');

		}
	};
	module.exports = rush;


}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);