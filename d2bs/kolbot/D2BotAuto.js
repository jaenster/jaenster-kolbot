/***************************************************
 *
 *
 * You do not need to set-up anything here
 *    You do this in the profile config file
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
const StarterConfig = {
	MinGameTime: 120,
	MaxGameTime: undefined,
	CreateGameDelay: 5,
	ResetCount: 30,
	CharacterDifference: 0,
};

print('ÿc2Jaensterÿc0 :: Started D2BotAuto.js');


include('require.js');
include("sdk.js");
include("OOG.js");
let handle, gameInfo;
function main() {
	let gameCount, nextGame, lastGameTick = 0;

	function getCurrentChannel() {
		const currChan = (ControlAction.getText(4, 28, 138, 354, 60) || []).first() || '';

		return currChan.split(" (") && currChan.split(" (")[0].toLowerCase() || '';
	}

	const waitFor = (seconds, name, fromTick = getTickCount()) => new Promise(function (resolve) {
		// Todo; update every second or something the status @ manager
		return fromTick + (seconds * 1000) - getTickCount() < 0 && resolve();
	});

	const LocationEvents = require('LocationEvents');
	const Promise = require('Promise');
	const Worker = require('Worker');
	const Config = require('Config').call();
	const Control = require('Control');
	const Login = require('Login');

	addEventListener('copydata', function (mode, msg) {
		print(JSON.stringify({mode: mode, msg: msg}));
		if (msg === "Handle") {
			handle = mode;
			Worker.push(() => DataFile.updateStats("handle", handle));
			Worker.push(() => D2Bot.init());
			!getScript('tools/heartbeat.js') && Worker.push(() => load("tools/heartbeat.js"));

			return;
		}

		switch (mode) {
			case 2: // Game info
				print("Recieved Game Info");
				gameInfo = JSON.parse(msg);

				break;
			case 4: // Heartbeat ping
				msg === "pingreq" && sendCopyData(null, me.windowtitle, 4, "pingrep");

				break;
			case 0xf124: // Cached info retreival
				if (msg !== "null") {
					gameInfo.crashInfo = JSON.parse(msg);
				}

				break;
		}
		return;
	});

	addEventListener('scriptmsg', function (data) {
		if (typeof data == 'object' && data && data.hasOwnProperty('pass')) {
			if (data.pass.hasOwnProperty('handle')) {
				handle = data.pass.handle;
				D2Bot.init();
			}
			print('HERE -- ' + data.pass.hasOwnProperty('gameInfo'));
			if (data.pass.hasOwnProperty('gameInfo')) {

				gameInfo = data.pass.gameInfo;
			}
		}
	});
	// create datafile (needs some refactoring trough)
	!FileTools.exists("data/" + me.profile + ".json") && DataFile.create();

	gameCount = DataFile.getStats().runs + 1;

	function setIngameTime() {
		// Once we are going IN game
		new Promise((resolve, reject) => me.ingame && me.gameReady && resolve() || getLocation() !== null && reject())
			.then(function () {
				// We are now in game, succesfully loaded
			})
			.catch(function () {
				// Failed to join, something like that
			})
			.finally(function () {
				lastGameTick = getTickCount();
			});
	}

	LocationEvents.on('location',
		// Hook upon location main menu and char select
		location => [sdk.locations.MainMenu, sdk.locations.CharSelect].indexOf(location[0]) !== -1

			// Wait until handle is known
			&& (new Promise(resolve => handle && resolve())).then(function () {
				const MoreChars = function () { // implemented some code here from imbalanced
					if (typeof me.loginRetry === "undefined") (me.loginRetry = 0) || sendKey(0x24); // start from beginning of the char list
					// char on 1st column, 4th row.
					let control = getControl(4, 237, 457, 72, 93);
					if (control) {
						control.click();
						sendKey(0x28); // press down
						sendKey(0x28);
						sendKey(0x28);
						sendKey(0x28);
					}
					me.loginRetry++;
					// Trigger the CharSelect event again
					me.loginRetry < 2 && LocationEvents.trigger(sdk.locations.CharSelect, sdk.locations.CharSelect);
				};

				// Once handle is known
				LocationEvents.on(sdk.locations.CharSelect, MoreChars);

				print('Logging in');
				// Single player char fi)
				//LocationEvents.once(sdk.locations.CharSelect, () => !getControl(4, 626, 100, 151, 44) && Control.CharSelectBack.click());


				try {
					print('Logging in');
					//ToDo; figure out of player wants to play via TCP/IP
					Login(me.profile);
					// If succesful
					LocationEvents.off(sdk.locations.CharSelect, MoreChars);
				} catch (e) {
					print(e + " " + (getLocation() || 'null'));
				}
			}));

	LocationEvents.on(sdk.locations.LoginError, function () {
		let text = Control.LoginErrorText.getText();
		if (text) {
			let string = text.join(' ');
			switch (string) {
				case getLocaleString(5207): // Invalid password
				case getLocalString(5208): // Invalid account
				case getLocaleString(5202): // cd key intended for another product
				case getLocaleString(10915): // lod key intended for another product
			}
		}
	});

	// Upon lobby, click on enter chat.
	LocationEvents.on(sdk.locations.Lobby, () => Control.EnterChat.click());

	const setNextgame = () => {
		print('Setting next game to ' + nextGame);
		nextGame = gameInfo.gameName + (++gameCount % StarterConfig.ResetCount);
		DataFile.updateStats("nextGame", nextGame);
		DataFile.updateStats("runs", gameCount);
	};
	LocationEvents.on(sdk.locations.LobbyChat, function () {
		const currentChannel = getCurrentChannel();
		// If we are not in the channel we want to be, join it
		if (typeof StarterConfig.JoinChannel === 'string' && StarterConfig.JoinChannel && currentChannel.toLowerCase() !== StarterConfig.JoinChannel) {
			say('/join ' + StarterConfig.JoinChannel);
		}

		print(JSON.stringify(Config.Follow));
		setNextgame();
		// If we dont follow, wait to create game.
		!Config.Follow && waitFor(StarterConfig.CreateGameDelay, 'create game')
		// Press create game
			.then(() => Control.CreateGameWindow.click()) // Create Game
			// If after 5 seconds, we are still at LobbyChat, the create button is bugged. Retry
			.then(() => waitFor(5)
				.then(() => getLocation() === sdk.locations.LobbyChat // If still in lobby, the create button is bugged
					&& Control.JoinGameWindow.click() // Press join game
					&& Control.CreateGameWindow.click() // Press create Game
				)
			)
	});

	LocationEvents.on(sdk.locations.MainMenuConnecting, function () {
		waitFor(20).then(function () {
			// If after 20 seconds we are still in connecting screen
			if (sdk.locations.MainMenuConnecting === getLocation()) {
				// Still in connection.
				//ToDo; do something with
			}
		});
	});

	// Upon joining
	LocationEvents.on(sdk.locations.CreateGame, function () {
		// fill in creation of game stuff here
		Control.GameName.setText(nextGame);
		Control.GamePass.setText(gameInfo.gamePass);


		// Set character difference
		if (typeof StarterConfig.CharacterDifference === "number") {
			Control.CharacterDifferenceButton.disabled === 4 && Control.CharacterDifferenceButton.click();
			Control.CharacterDifference.setText(StarterConfig.CharacterDifference.toString());

		} else if (Control.CharacterDifferenceButton.disabled === 5) {
			Control.CharacterDifferenceButton.click()
		}

		if (gameInfo.difficulty.toLowerCase() === 'highest') {
			if (!Control.Hell.click() && !Control.Nightmare.click() && !Control.Normal.click()) {
				print('Cant select dificulty, wtf?');

			}
		} else {
			Control[gameInfo.difficulty.capitalize()].click();
		}

		Control.CreateGame.click();
	});

	LocationEvents.on('locations', locations => {
		if (locations[1] === null) { // Just came out of a game
			print('HERE');
			D2bot.updateRuns();
		}
	});

	let lastTimer = getTickCount();
	D2Bot.requestGameInfo();
	while (!gameInfo) {
		if (getTickCount() - lastTimer > 500) {
			lastTimer = getTickCount();
			print('send request');
			D2Bot.requestGameInfo();
		}
		delay(500);
	}

	getLocation() === sdk.locations.None && sendKey(32);
	nextGame = gameInfo.gameName + (++gameCount % StarterConfig.ResetCount);
	while (true) {
		delay(10);
	}
}