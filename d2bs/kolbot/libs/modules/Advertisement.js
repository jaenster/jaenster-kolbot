/**
 * @description Advertise your game for other botters
 * @author Jaenster
 */

(function (module, require) {
	const Config = require('../modules/Config');
	const Delta = new (require('../modules/Deltas'));
	const Channel = require('../modules/Channel');
	const myEvents = new (require('../modules/Events'));

	// in case it didnt ran yet
	!Config.loaded && Config();

	const send = (data) => Config.Advertisement && typeof realmChannel === 'object' && realmChannel.hasOwnProperty('on') && realmChannel.send({Advertise: data});
	const onEvent = function (data) {
		if (data.hasOwnProperty('game')) {
			if (data.game.hasOwnProperty('expansion') && data.game.hasOwnProperty('ladder') && data.game.hasOwnProperty('hardcore')
				&& data.game.hasOwnProperty('name') && data.game.hasOwnProperty('password') && data.game.hasOwnProperty('diff')) {

				// So, we retrieved a game, and the info about it. Lets parse it
				if (['expansion', 'ladder', 'hardcore'].every(key => data.game[key] === me[key])) {
					myEvents.emit('game', data.game);
				}
			}
		}
	};

	Object.defineProperty(me, '__advertisementStats', {
		get: function () {
			return {
				expansion: !!me.gametype,
				ladder: !me.ladder,
				hardcore: !!me.playertype,
				gamename: me.gamename,
				gameserverip: me.gameserverip,
				gamepassword: me.gamepassword,
				diff: me.diff,
				numberOfPlayers: (function (count = 0) {
					if (me.gameReady && getParty()) for (let party = getParty(); party && party.getNext();) count++;
					return count;
				}).call(),
			}
		}
	});

	let realmChannel;
	Delta.track(() => me.realm, () => realmChannel = me.realm && new Channel(me.realm));
	Delta.track(() => realmChannel, () => typeof realmChannel === 'object' && realmChannel.hasOwnProperty('on') && realmChannel.on('Advertise', onEvent));
	Delta.track(() => JSON.stringify(me.__advertisementStats), () => me.__advertisementStats.gamename && send({game: me.__advertisementStats}));

	module.exports = myEvents;

}).call(null, module, require);

