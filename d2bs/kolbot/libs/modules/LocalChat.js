/**
 * @author Nishimura-Katsuo
 * @description Local chat, by pass the char server
 */

module.exports = new function () {
	const Config = require('Config');
	const PacketBuilder = require('PacketBuilder');
	const Channel = require('Channel');

	const LOCAL_CHAT_ID = 0xD2BAAAA;

	let proxy = global['say'];

	let relay = (msg) => Config.LocalChat.Mode < 4 ? D2Bot.shoutGlobal(JSON.stringify({
		msg: msg,
		realm: me.realm,
		charname: me.charname,
		gamename: me.gamename
	}), LOCAL_CHAT_ID) : (Channel.inGame.send({LocalChat: {charname: me.charname, msg: msg}}));

	let onChatInput = (speaker, msg) => {
		relay(msg);
		return true;
	};

	let onChatRecv = (mode, msg) => {
		if (mode !== LOCAL_CHAT_ID) {
			return;
		}

		msg = JSON.parse(msg);

		if (me.gamename === msg.gamename && me.realm === msg.realm) {
			spoof(msg);
		}
	};
	const spoof = msg => new PacketBuilder().byte(38).byte(1, me.locale).word(2, 0, 0).byte(90).string(msg.charname, msg.msg).get();

	Config.LocalChat.Mode = (Config.LocalChat.Mode) % 3;
	print("ÿc2LocalChat enabled. Mode: " + Config.LocalChat.Mode);

	switch (Config.LocalChat.Mode) {
		case 4:
			Channel.inGame.on('LocalChat', function (data) {
				data.hasOwnProperty('charname') && data.hasOwnProperty('msg') && spoof(data);
			});
			global['say'] = (msg, force = false) => force ? proxy(msg) : relay(msg);
			break;
		case 2:
		case 1:
			Config.LocalChat.Mode === 2 && removeEventListener("chatinputblocker", onChatInput);
			Config.LocalChat.Mode === 2 && addEventListener("chatinputblocker", onChatInput);
			removeEventListener("copydata", onChatRecv);
			addEventListener("copydata", onChatRecv);
			global['say'] = (msg, force = false) => force ? proxy(msg) : relay(msg);
			break;
		case 0:
			removeEventListener("chatinputblocker", onChatInput);
			removeEventListener("copydata", onChatRecv);
			global['say'] = proxy;
			break;
	}
};