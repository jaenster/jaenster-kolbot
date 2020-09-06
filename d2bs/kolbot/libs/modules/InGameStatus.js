/**
 * @description Update status for ingame information
 * @author Jaenster
 */


(function (module, require, thread) {
	/** @type Delta */
	const Messaging = require('Messaging');
	if (thread === 'thread') { // Run this in a separated thread to avoid d2bs crashes due to wm_sendmessage
		include('oog.js'); // need to include this as require-js doesnt do it
		Messaging.on('InGameStatus', function (data) {
			if (data.hasOwnProperty('msg')) {
				D2Bot.updateStatus(data.msg); // Send msg to the proper place
			}
		});

		while (true) delay(10);
	} else if (thread === 'started') {
		const Delta = new (require('Deltas'));
		const Loader = require('Loader');

		// From GameData
		const LocaleStrings = [5389, 5055, 5054, 5053, 5052, 5051, 5050, 5049, 5048, 5047, 5046, 5045, 5044, 5043, 5042, 5041, 5040, 5039, 5038, 5037, 5036, 5035, 5034, 5033, 5032, 5031, 5030, 5029, 5028, 5027, 5026, 5025, 5024, 5023, 5022, 5021, 5020, 5019, 5018, 788, 852, 851, 850, 849, 848, 847, 846, 845, 844, 843, 842, 841, 840, 839, 838, 837, 836, 835, 834, 833, 832, 831, 830, 829, 828, 827, 826, 826, 826, 826, 826, 826, 826, 825, 824, 820, 819, 818, 817, 816, 815, 814, 813, 812, 810, 811, 809, 808, 806, 805, 807, 804, 845, 844, 803, 802, 801, 800, 799, 798, 797, 796, 795, 790, 792, 793, 794, 791, 789, 22646, 22647, 22648, 22649, 22650, 22651, 22652, 22653, 22654, 22655, 22656, 22657, 22658, 22659, 22660, 22662, 21865, 21866, 21867, 22663, 22664, 22665, 22667, 22666, 5389, 5389, 5389, 5018];

		// From ToolsThread
		const Experience = {
			totalExp: [0, 0, 500, 1500, 3750, 7875, 14175, 22680, 32886, 44396, 57715, 72144, 90180, 112725, 140906, 176132, 220165, 275207, 344008, 430010, 537513, 671891, 839864, 1049830, 1312287, 1640359, 2050449, 2563061, 3203826, 3902260, 4663553, 5493363, 6397855, 7383752, 8458379, 9629723, 10906488, 12298162, 13815086, 15468534, 17270791, 19235252, 21376515, 23710491, 26254525, 29027522, 32050088, 35344686, 38935798, 42850109, 47116709, 51767302, 56836449, 62361819, 68384473, 74949165, 82104680, 89904191, 98405658, 107672256, 117772849, 128782495, 140783010, 153863570, 168121381, 183662396, 200602101, 219066380, 239192444, 261129853, 285041630, 311105466, 339515048, 370481492, 404234916, 441026148, 481128591, 524840254, 572485967, 624419793, 681027665, 742730244, 809986056, 883294891, 963201521, 1050299747, 1145236814, 1248718217, 1361512946, 1484459201, 1618470619, 1764543065, 1923762030, 2097310703, 2286478756, 2492671933, 2717422497, 2962400612, 3229426756, 3520485254, 0, 0],
			nextExp: [0, 500, 1000, 2250, 4125, 6300, 8505, 10206, 11510, 13319, 14429, 18036, 22545, 28181, 35226, 44033, 55042, 68801, 86002, 107503, 134378, 167973, 209966, 262457, 328072, 410090, 512612, 640765, 698434, 761293, 829810, 904492, 985897, 1074627, 1171344, 1276765, 1391674, 1516924, 1653448, 1802257, 1964461, 2141263, 2333976, 2544034, 2772997, 3022566, 3294598, 3591112, 3914311, 4266600, 4650593, 5069147, 5525370, 6022654, 6564692, 7155515, 7799511, 8501467, 9266598, 10100593, 11009646, 12000515, 13080560, 14257811, 15541015, 16939705, 18464279, 20126064, 21937409, 23911777, 26063836, 28409582, 30966444, 33753424, 36791232, 40102443, 43711663, 47645713, 51933826, 56607872, 61702579, 67255812, 73308835, 79906630, 87098226, 94937067, 103481403, 112794729, 122946255, 134011418, 146072446, 159218965, 173548673, 189168053, 206193177, 224750564, 244978115, 267026144, 291058498, 0, 0],
		};

		const gameStart = getTickCount();
		const timer = () => {
			let min = Math.floor((getTickCount() - gameStart) / 60000);
			let sec = (Math.floor((getTickCount() - gameStart) / 1000) % 60);

			// Remove the start digit
			min <= 9 && (min = "0" + min.toString());
			sec <= 9 && (sec = "0" + sec.toString());

			return min.toString() + ":" + sec.toString();
		};

		Delta.track(() => {
			let parts = !me.gameReady ? [] : [
				// Level: 89 (25.35%)
				'Level: ' + me.charlvl + ' (' + (me.charlvl !== 99 && (((me.getStat(sdk.stats.Experience) - Experience.totalExp[me.charlvl]) / Experience.nextExp[me.charlvl]) * 100).toFixed(2) || 0).toString() + '%)',
				// Area: Cold Plains
				'Area: ' + getLocaleString(LocaleStrings[me.area]),
				// Time: 01:31
				'Time: ' + timer(),
				'Script: ' + Loader.scriptList[Loader.scriptIndex],
				// Gold: 1523343
				'Gold: ' + me.getStat(sdk.stats.Gold) + me.getStat(sdk.stats.Goldbank),
				// Hell
				['Normal', 'Nightmare', 'Hell'][me.diff],
			];
			return parts.join(' | '); // Level: 89 (25.35%) | Area: Cold Plains | Time: 01:31 | Gold: 1523343 | Hell

		}, msg => Messaging.send({InGameStatus: {msg: msg}}));
	}


	module.exports = Delta;
}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require, getScript.startAsThread());