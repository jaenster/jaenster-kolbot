/**
 * @description A rush
 * @author Jaenster
 * @config

 Config.Rush.Give = false; // get a rush. If true, it gives one.

 */


function Rush(Config, Attack, Pickit) {
	const aloneInGame = function () {
		for (let party = getParty(), acceptFirst; party && party.getNext();) if (party.name !== me.name) return false;
		return true; // Yep
	};
	// List of quests it does
	const questList = [sdk.quests.ForgottenTower, sdk.quests.SistersToTheSlaughter, sdk.quests.TheTaintedSun, sdk.quests.TheHoradricStaff];

	const Team = require('Team');
	const Promise = require('Promise');
	const Worker = require('Worker');
	require('debug');
	const portalTaker = questList.map(x => false); // Make an array of questList as an

	const sameAreaAs = other => {
		for (let party = getParty(); party && party.getNext();) if (party.name === other && party.area === me.area) return true;
	};
	const waitFor = function (player) {
		while (!sameAreaAs(player)) delay(10);
	};
	const waitForNot = function (player) {
		while (sameAreaAs(player)) delay(10);
	};

	if (Config.Rush.Give) {
		const workList = [];
		const doneQuests = [];
		const doQuest = function (number) {
			doneQuests.push(number);
			let leader = portalTaker[questList.indexOf(number)], poi;
			print('DOING QUEST -- ' + number + ' -- Portal taker ' + leader);
			Team.broadcastInGame({rush: {doing: number, rusher: me.charname}});
			Town.doChores();
			switch (number) { // Going to the location
				case sdk.quests.ForgottenTower: // Countress
					Pather.journeyTo(sdk.areas.TowerCellarLvl5);
					poi = getPresetUnit(me.area, 2, 580);
					switch (poi.roomx * 5 + poi.x) {
						case 12565:
							Pather.moveTo(12527, 11063);
							break;
						case 12526:
							Pather.moveTo(12567, 11027);
							break;
					}
					break;
				case sdk.quests.SistersToTheSlaughter: // andy
					Pather.journeyTo(sdk.areas.CatacombsLvl4);
					me.clear(10); // clear around catacombs 4.
					break;
				case sdk.quests.TheTaintedSun: // amulet
					print('The Tainted Sun');
					Pather.journeyTo(sdk.areas.ClawViperTempleLvl2);
					Pather.moveTo(15044, 14045);
					break;
				case sdk.quests.TheHoradricStaff:
					Pather.journeyTo(sdk.areas.MaggotLairLvl3);
					Pather.moveToPreset(me.area, 2, 356);
			}
			// ---
			Attack.securePosition(me.x, me.y, 20, 3000);
			// ---
			const portal = Pather.makePortal();
			const [portal_x, portal_y] = [portal.x, portal.y];
			print('Wait for ' + leader + ' to come -- ' + portal_x + ',' + portal_y);
			waitFor(leader);
			print('char came');
			switch (number) { // Doing stuff
				case sdk.quests.ForgottenTower:
					let [x, y] = [me.x, me.y];
					Pather.moveToPreset(me.area, 2, 580);
					let countress;
					while (!(countress = getUnits(2).filter(x => x.name === getLocaleString(2875)).first())) delay(1200);
					countress.kill(); // kill her
					break;
				case sdk.quests.SistersToTheSlaughter:
					Attack.kill(156); // Andariel
					Pather.moveTo(22549, 9520);
					Pather.moveToExit(sdk.areas.CatacombsLvl3, false);
			}
			Pather.moveTo(portal_x, portal_y);
			switch (number) {
				case sdk.quests.ForgottenTower:
				case sdk.quests.SistersToTheSlaughter:
					Pather.usePortal(null, me.charname); // back to town
					break;
				case sdk.quests.TheTaintedSun:
				case sdk.quests.TheHoradricStaff:
					waitForNot(leader);
					Pather.usePortal(null, null, portal);

			}

		};
		Team.on('rush', function (msg) {
			if (msg.hasOwnProperty('do') && typeof msg.do === 'number') {

				let index = workList.indexOf(msg.do);
				if (index === -1 && doneQuests.indexOf(msg.do) === -1) {
					print('Added quest ' + msg.do + ' to list');

					workList.push(msg.do);
					msg.reply({rush: {added: msg.do}});
					portalTaker[questList.indexOf(msg.do)] = msg.requester;
				}
			}
		});

		while (aloneInGame()) delay(3);


		while (delay(10) || true) {
			if (!workList.length) continue; // if nothing to do
			doQuest(workList.shift());

		}


	} else { // get a rush
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////         rushee               /////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////
		const Quests = require('Quests');

		const rusher = questList.map(x => false);
		const questStart = new (require('Events'))();
		let currentlyDoing = -1;

		while (!getParty()) delay(10); // waiting for the party to get up

		// Listen on msg's from rusher
		Team.on('rush', function (msg) {
			print(JSON.stringify(msg));
			if (msg.hasOwnProperty('added') && typeof msg.added === 'number') {
				print('Im the leader of ' + (Object.keys(sdk.quests).filter(x => sdk.quests[x] === msg.added).first()));
				portalTaker[questList.indexOf(msg.added)] = true; // Im the one that takes the portal
			}

			if (msg.hasOwnProperty('doing') && typeof msg.doing === "number") {
				print('get rush for ' + (Object.keys(sdk.quests).filter(x => sdk.quests[x] === msg.doing).first()));
				currentlyDoing = msg.doing;

				rusher[questList.indexOf(msg.doing)] = msg.rusher; // the person who rushes us
				Worker.push(() => questStart.emit(msg.doing));
			}
		});

		[ // Handlers for the more stupid quests where you do not need to talk/take care of anything
			{quest: sdk.quests.ForgottenTower, area: sdk.areas.TowerCellarLvl5, town: 1},
			{quest: sdk.quests.SistersToTheSlaughter, area: sdk.areas.CatacombsLvl4, town: 1},
			{quest: sdk.quests.TheTaintedSun, area: sdk.areas.ClawViperTempleLvl2, town: 2, chest: 149, item: 521},
			{quest: sdk.quests.TheHoradricStaff, area: sdk.areas.MaggotLairLvl3, town: 2, item: 92, chest: 356},
		]
			.forEach(function (what) {
				questStart.on(what.quest, function () {
					const questname = Object.keys(sdk.quests).filter(x => sdk.quests[x] === what.quest).first();
					print('Starting quest --> ' + questname);
					Town.goToTown(what.town);
					// If we are the portal taker, go to the portal spot
					if (portalTaker[questList.indexOf(what.quest)]) {
						Town.move("portalspot"); // Move to portal spot
						print('Taking portal to ' + (Object.keys(sdk.areas).filter(x => sdk.areas[x] === what.area).first()) + ' -- ' + rusher[questList.indexOf(what.quest)]);
						print('CURRENTLY DOING -- ' + currentlyDoing);

						while (currentlyDoing === what.quest) {
							Pather.usePortal(what.area, rusher[questList.indexOf(what.quest)]);
							if (me.area === what.area) {

								if (what.hasOwnProperty('chest')) {
									delay(250);
									let chest = getUnit(2, what.chest);
									Misc.openChest(chest);
								}

								if (what.hasOwnProperty('item')) {
									let item = getUnit(4, what.item);
									if (!item) for (let i = 0; i < 10 && !item; i += 1) {
										delay(100 + me.ping);
										item = getUnit(4, what.item);
									}
									for (let i = 0; i < 3 && !Pickit.pickItem(item); i += 1) {
										delay(250 + me.ping * 2);
									}
								}

								if (!what.hasOwnProperty('chest') && !what.hasOwnProperty('item')) {
									print('WAITING FOR ' + rusher[questList.indexOf(what.quest)] + ' TO LEAVE AREA');
									waitForNot(rusher[questList.indexOf(what.quest)]);
									print('PLAYER LEFT');
								}

								Pather.usePortal(null, null, getUnits(1, 'portal').sort((a, b) => a.distance - b.distance).first());
								return; // done
							}

						}
					}
				});
			});

		// Tainted sun is a special quest, as we need to talk to Drognan once we have the darkness hitting us.
		// addEventListener('gamepacket',bytes => bytes && bytes.length > 0 && bytes[0] === 0x53 && Worker.push(() => {
		// 	print('DARKNESS FELL');
		// 	new Promise(resolve => me.area === sdk.areas.LutGholein && resolve())
		// 		.then(function() {
		// 			// We are in act 2, we need to talk to Drognan
		// 			print('TALK TO Drognan');
		// 			let ret = [me.x,me.y];
		// 			[5093,5037].moveTo();
		// 			TalkTo('Drognan');
		// 			ret.moveTo();
		// 		})
		// })());
		const TalkTo = function (name) {
			var npc, i;

			if (!me.inTown) {
				Town.goToTown();
			}

			for (i = 5; i; i -= 1) {
				Town.move(name === "jerhyn" ? "palace" : name);
				npc = getUnit(1, name === "cain" ? "deckard cain" : name);
				if (npc) {
					if (npc.openMenu()) {
						me.cancel();
						return true;
					}
				}
				Packet.flash(me.gid);
				delay(me.ping * 2 + 500);
				Pather.moveTo(me.x + rand(-5, 5), me.y + rand(-5, 5));
			}

			return false;
		};

		Worker.runInBackground.QuestDecider = function () {
			let choicenQuest = questList.filter(x => {
				switch (x) { // Some specific's
					case sdk.quests.SistersToTheSlaughter:
						return !(Quests.states[x][1] + Quests.states[x][0]);

				}
				return !Quests.states[x][0];
			}).first(); // Filter out those we have done
			Team.broadcastInGame({rush: {do: choicenQuest, requester: me.charname}});
			return true;
		};

		delay(10); // give the quests some time to load
		while (aloneInGame()) delay(3);
		print('Others in game now');

		Quests.on(sdk.quests.SistersToTheSlaughter, function (states) {
			print('----- ' + !me.getQuest(sdk.quests.AbleToGotoActII, 0)); // can we go to act 2
			if (states[1] /*need to talk to warriv*/) {
				print('TALK TO WARRIVE NEXT TIME IN TOWN');
				new Promise(resolve => me.inTown && resolve()).then(function () {
					print('TALK TO WARRIV');
					Town.moveTo(NPC.Warriv);
					let warriv = getUnit(1, NPC.Warriv);
					warriv.openMenu(); // Open menu
					Misc.useMenu(sdk.menu.GoEast); // use menu
				})
			}

		});

		while (true) {
			delay(100);
		}


	}
}
