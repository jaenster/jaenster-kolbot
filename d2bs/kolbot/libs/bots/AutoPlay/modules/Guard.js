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

			// quit game if default is hanging
			Delta.track(() => getTickCount() - lastPing > 10e3, quitGame);

			// quit game if still in the same area after 10 minutes

			let lastAreaChange = getTickCount();
			Delta.track(() => me.area, () => lastAreaChange = getTickCount());
			Delta.track(() => getTickCount() - lastAreaChange > 60 * 10 * 1000, quitGame);

			Delta.track(() => me.hp * 100 / me.hpmax, function (o, n) {

				// dont care if we dont lose hp
				if (o < n) return;

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

			const DebugStack = (new function () {
				let self = this;
				let stack;

				/**
				 * @constructor
				 * @param {function():string} callback
				 */
				function UpdateableText(callback) {
					let element = new Text(callback(), self.x + 15, self.y + (7 * self.hooks.length), 0, 12, 0);
					self.hooks.push(element);
					this.update = () => {
						element.text = callback();
						element.visible = !getUIFlag(sdk.uiflags.Iventory); // hide if inventory is open
					}
				}

				this.hooks = [];
				this.x = 500;
				this.y = 600 - (400 + (self.hooks.length * 15));
				// this.box = new Box(this.x-2, this.y-20, 250, (self.hooks.length * 15), 0, 0.2);


				for (let i = 0; i < 15; i++) {
					(i => this.hooks.push(new UpdateableText(() => stack && stack.length > i && stack[i] || '')))(i);
				}

				this.update = () => {
					stack = new Error().stack.match(/[^\r\n]+/g);
					stack = stack && stack.slice(7/*skip path to here*/).map(el => {
						let line = el.substr(el.lastIndexOf(':') + 1),
							functionName = el.substr(0, el.indexOf('@')),
							filename = el.substr(el.lastIndexOf('\\') + 1);

						filename = filename.substr(0, filename.indexOf('.'));

						return filename + 'ÿc::ÿc0' + line + 'ÿc:@ÿc0' + functionName;
					});
					this.hooks.filter(hook => hook.hasOwnProperty('update') && typeof hook.update === 'function' && hook.update());
				};

			}).update;

			Worker.runInBackground.heartbeatForGuard = function () {
				if ((getTickCount() - timer) < 1000 || (timer = getTickCount()) && false) return true;

				DebugStack();

				// Drop broken eth items that arent a belt
				me.getItems()
					.filter(el=> //ToDo; minor point but this can fuck up zod bugged items
						el.location === sdk.storage.Equipment
						&& el.getStat(sdk.stats.Durability) === 0
						&& el.bodylocation !== sdk.body.Belt
						&& el.getFlag(0x400000/*eth*/)
					)
					.forEach(item => item.drop());

				// Every second or so, we send a heartbeat tick
				Messaging.send({Guard: {heartbeat: getTickCount()}});

				return true;
			};

			const Town = require('../../../modules/Town');
			const Pather = require('../../../modules/Pather');

			// town chicken shit
			Messaging.on('TownChicken', data => typeof data === 'object' && data && data.hasOwnProperty('do') && data.do && (function () {
				console.debug('town chicken fuck you');
				let area = me.area;
				try {
					Town.goToTown();
				} catch (e) {
					console.debug('No such thing as going to town?');
					quit();
				}
				let [x, y] = [me.x, me.y];

				Town();

				Pather.moveTo(x, y);
				Pather.usePortal(area, me.name)


			})());

		}
	}
).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require, getScript.startAsThread());
