/**
 * @description A generic packet snooper
 * @author Nishimura-Katsuo
 *
 */

(function (module, require) {


	function fixInt(num) {
		return ((num & 0x7FFF) << 1) | ((num >> 15) & 1);
	}

	function logPackets(handle = D2Bot.handle) {
		const Worker = require('../modules/Worker');
		let excludedSC = [0x0E, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x23, 0x8f, 0x8a, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x7, 0x7b, 0x8, 0xa, 0x51, 0x96, 0xac, 0xaa, 0x65, 0x47, 0x48, 0x53]; // 0xD is player stop? can we do something with this?
		let blockedSC = [0x2c];
		let excludedCS = [0x00, 0x01, 0x02, 0x03, 0x6d];
		let blockedCS = [];
		let blocking = false;
		let logging = false;
		let lastGID = -1;

		function printm(msg, color = 0, tooltip = "", trigger = "") {
			Worker.push(() => {
				print(msg);
				var printObj = {
						msg: msg,
						color: color,
						tooltip: tooltip,
						trigger: trigger
					},

					obj = {
						profile: me.profile,
						func: "printToConsole",
						args: [JSON.stringify(printObj)]
					};
				sendCopyData(null, handle, 0, JSON.stringify(obj));

				return true;
			});
		}


		addEventListener("keyup", function (key) {
			switch (key) {
				case 119:
					if (lastGID > 0) {
						sendPacket(1, 0x2f, 4, 1, 4, lastGID);
					}

					break;
				case 120:
					if (lastGID > 0) {
						sendPacket(1, 0x30, 4, 1, 4, lastGID);
					}

					break;
				case 121:
					blocking = !blocking;

					if (blocking) {
						printm("Blocking packets!");
					} else {
						printm("Not blocking packets!");
					}

					break;
				case 122:
					logging = !logging;

					if (logging) {
						printm("Logging packets!");
					} else {
						printm("Not logging packets!");
					}

					break;
				default:
					break;
			}
		});

		addEventListener("gamepacket", function (packet) {
			let packetbytes = [];

			if (!logging) {
				return false;
			}

			if (excludedSC.indexOf(packet[0]) > -1) {
				return false;
			}

			for (let b in packet) {
				let cb = packet[b].toString(16);

				while (cb.length < 2) {
					cb = "0" + cb;
				}

				packetbytes.push(cb);
			}

			if (blocking && blockedSC.indexOf(packet[0]) > -1) {
				printm("S->C: " + packetbytes.join(" "), 9);

				return true;
			}

			printm("S->C: " + packetbytes.join(" "), 6);
		});

		addEventListener("gamepacketsent", function (packet) {
			let packetbytes = [];


			if (!logging) {
				return false;
			}

			if (excludedCS.indexOf(packet[0]) > -1) {
				return false;
			}

			for (let b in packet) {
				let cb = packet[b].toString(16);

				while (cb.length < 2) {
					cb = "0" + cb;
				}

				packetbytes.push(cb);
			}

			if (blocking && blockedCS.indexOf(packet[0]) > -1) {
				printm("C->S: " + packetbytes.join(" "), 9);
				return true;
			}

			printm("C->S: " + packetbytes.join(" "), 5);


			return false;
		});
	}

	logPackets();

	print("Packet snooper loaded!");
})(module, require);