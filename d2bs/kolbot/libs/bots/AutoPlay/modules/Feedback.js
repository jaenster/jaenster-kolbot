(function (module, require, thread) {

	const Messaging = require("../../../modules/Messaging");

	const feedbackData = {
		lastDecision: '',
		quest: '',
		area: '',

	};

	const updateRecursively = (oldObj, newObj, path = []) => {
		Object.keys(newObj).forEach(key => {
			if (typeof newObj[key] !== 'object') {
				if (!oldObj.hasOwnProperty(key) || oldObj[key] !== newObj[key]) {
					oldObj[key] = newObj[key];
					// print('update - ' + path.join('.') + '.' + key + ' = ' + newObj[key]);
				}

			} else {
				if (typeof oldObj[key] !== 'object') {
					oldObj[key] = {};
				}
				path.push(key);
				updateRecursively(oldObj[key], newObj[key], path);
			}
		})
	};

	// The thread that actually shows the shit
	if (thread === 'thread') {
		const Worker = require('../../../modules/Worker');
		const Experience = require('../../../modules/Experience');

		const timer = (tick => new Date(getTickCount() - tick).toISOString().slice(15, -3)).bind(null, getTickCount());

		// update data blob
		Messaging.on('Feedback', el => {
			typeof el === 'object' && el && typeof el['update'] === 'object' && el.update && updateRecursively(feedbackData, el.update);
		});

		Worker.runInBackground.Overview = (new function () {
			let self = this, startXP = me.getStat(13);

			/**
			 * @constructor
			 * @param {function():string} callback
			 */
			function updateableText(callback) {
				let element = new Text(callback(), self.x + 15, self.y + (7 * self.hooks.length), 0, 12, 0);
				self.hooks.push(element);
				this.update = () => {
					element.text = callback();
					element.visible = !getUIFlag(sdk.uiflags.Iventory); // hide if inventory is open
				}
			}

			this.hooks = [];
			this.x = 800 - 400;
			this.y = 600 - 200 - (self.hooks.length * 15);
			// this.box = new Box(this.x-2, this.y-20, 250, (self.hooks.length * 15), 0, 0.2);

			this.hooks.push(new updateableText(
				() =>
					['\xFFc:Xp: \xFFc0' + Math.floor(me.getStat(13) / 1000 / 1000) + 'm',
						'\xFFc:Gain: \xFFc0' + Math.floor((me.getStat(13) - startXP) / 1000) + 'k',
						'\xFFc:Lvl: \xFFc0' + me.charlvl + '.' + Math.floor(parseInt(Experience.progress()) / 10),
						'\xFFc:Gold: \xFFc0' + me.gold,
						'\xFFc:fps: \xFFc0' + me.fps,
						'\xFFc:ping: \xFFc0' + me.ping,
					].join(' ')
				)
			);

			this.hooks.push({update: () => void 2});
			this.hooks.push(new updateableText(() => '\xFFc:Last decision: \xFFc0' + feedbackData.lastDecision));
			this.hooks.push(new updateableText(() => '\xFFc:Working towards quest: \xFFc0' + (feedbackData && feedbackData.quest && feedbackData.quest.name || 'Dont need to quest to level')));
			this.hooks.push(new updateableText(() => '\xFFc:Want to level in area: \xFFc0' + (feedbackData && feedbackData.area && feedbackData.area.LocaleString || '....')));

			this.hooks.push(new updateableText(
				((pen) =>
					['\xFFc:Res:\xFFc0',
						Math.min(me.getStat(sdk.stats.Fireresist) - pen, me.getStat(sdk.stats.Maxfireresist) + 75) + ' /',
						Math.min(me.getStat(sdk.stats.Coldresist) - pen, me.getStat(sdk.stats.Maxcoldresist) + 75) + ' /',
						Math.min(me.getStat(sdk.stats.Lightresist) - pen, me.getStat(sdk.stats.Maxlightresist) + 75) + ' /',
						Math.min(me.getStat(sdk.stats.Poisonresist) - pen, me.getStat(sdk.stats.Maxpoisonresist) + 75) + ' /',
						'\xFFc:fhr: \xFFc0' + me.getStat(sdk.stats.Fastermovevelocity),
						'\xFFc:ias: \xFFc0' + me.getStat(sdk.stats.Fasterattackrate),
						'\xFFc:fcr: \xFFc0' + me.getStat(sdk.stats.Fastercastrate),
						'\xFFc:frw: \xFFc0' + me.getStat(sdk.stats.Fastermovevelocity),
						'\xFFc:dr: \xFFc0' + Math.min(me.getStat(sdk.stats.Damageresist) || 0, 50), // capped on 50
					].join(' ')).bind(null, [[0, -20, -50], [0, -40, -100]][me.gametype][me.diff])
				)
			);
			this.hooks.push(new updateableText(() => '- Jaenster -                                           Game time: ' + timer()));


			this.hooks.push(new Box(this.x + 210 + 2, this.y - 15, Math.round(800 / 2), self.hooks.length * 7.5 - 4, 0x0, 1, 2));
			// this.hooks.push(new Frame(this.x+210, this.y - 15, Math.round(800/2), self.hooks.length * 7.5, 2));

			this.hooks[this.hooks.length - 1].zorder = 0;


			this.update = () => this.hooks.filter(hook => hook.hasOwnProperty('update') && typeof hook.update === 'function' && hook.update());

			return true; // Always return true to keep it running
		}).update;


		while (true) {
			delay(3);
		}
	} else {
		const Delta = (new require('../../../modules/Deltas'))();

		Delta.track(() => JSON.stringify(feedbackData), (o, n) => {
			const recursiveSearch = (o, n, changed = {}) => {
				Object.keys(n).forEach(key => {
					if (typeof n[key] !== 'object') {
						if (!o.hasOwnProperty(key) || o[key] !== n[key]) {
							changed[key] = n[key];
						}

					} else {
						if (typeof changed[key] !== 'object' || !changed[key]) changed[key] = {};
						recursiveSearch(o[key] || {}, n[key], changed[key]);
						if (!Object.keys(changed[key]).length) delete changed[key];
					}
				});
				return changed;
			};


			const changed = recursiveSearch(JSON.parse(o) || {}, feedbackData);

			// gets rid of the property descriptions that d2bs dont handle well
			let converted = JSON.parse(JSON.stringify(changed));

			Messaging.send({Feedback: {update: converted}});
		});
	}

	module.exports = feedbackData;

}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require, getScript.startAsThread());