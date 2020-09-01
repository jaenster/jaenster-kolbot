/**
 * @description Simple module that keeps on eye on the main
 * @author Jaenster
 */

(function (module, require, thread) {

		const Messaging = require('../../../modules/Messaging');
		const Delta = new (require('../../../modules/Deltas'));

		if (thread === 'thread') {

			let lastPing = getTickCount();
			Messaging.on('Guard', (data => typeof data === 'object' && data && data.hasOwnProperty('heartbeat') && (lastPing = data.heartbeat)));


			//
			// Delta.track(() => getTickCount() - lastPing > 10e3, quitGame);

			Delta.track(() => me.hp * 100 / me.hpmax, function(o,n) {

				// dont care if we dont lose hp
				if (o<n) return;

				if (n < 40 && me.inTown) {
					Messaging.send({TownChicken: {do: true}});
				}
			});



			while (1) {
				delay(100);
			}

		} else if (getScript(true).name.toLowerCase() === 'default.dbj') {

			const Worker = require('../../../modules/Worker');
			let timer = getTickCount();

			Worker.runInBackground.heartbeatForGuard = function () {
				if ((getTickCount() - timer) < 1000 || (timer = getTickCount()) && false) return true;

				// Every second or so, we send a heartbeat tick
				Messaging.send({Guard: {heartbeat: getTickCount()}});

				return true;
			};

			const Town = require('../../../modules/Town');
			const Pather = require('../../../modules/Pather');

			// town chicken shit
			Messaging.on('TownChicken',data => typeof data === 'object' && data && data.hasOwnProperty('do') && data.do && (function() {
				console.debug('town chicken fuck you');
				let area = me.area;
				try {
					Town.goToTown();
				} catch (e) {
					console.debug('No such thing as going to town?');
					quit();
				}
				let [x,y] = [me.x,me.y];

				Town();

				Pather.moveTo(x,y);
				Pather.usePortal(area, me.name)



			})());

		}
	}
).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require, getScript.startAsThread());
