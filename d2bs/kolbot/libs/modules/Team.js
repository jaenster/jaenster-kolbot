/**
 * @description Easy communication between clients
 * @Author Jaenster
 */


(function (module, require) {
	const myEvents = new (require('Events'));
	const Worker = require('Worker');

	const others = [];

	Worker.runInBackground.copydata = (new function () {
		const workBench = [];
		const updateOtherProfiles = function () {
			const fileList = dopen("data/").getFiles();
			if (fileList) fileList.forEach(function (filename) {
				let obj, profile = filename.split("").reverse().splice(5).reverse().join(''); // strip the last 5 chars (.json) = 5 chars


				if (profile === me.windowtitle || !filename.endsWith('.json')) return;

				let content = File.open('data/' + filename, 0);// open data file
				if (!content) return; // no content
				content = content.readAllLines();
				if (!content) return; // no content
				try {
					obj = JSON.parse(content);
				} catch (e) {
					return;
				}

				let other;
				for (let i = 0, tmp; i < others.length; i++) {
					tmp = others[i];
					if (tmp.hasOwnProperty('profile') && tmp.profile === profile) {
						other = tmp;
						break;
					}
				}

				if (!other) {
					others.push(obj);
					other = others[others.length - 1];
				}

				other.profile = profile;
				Object.keys(content).map(key => other[key] = content[key]);
			})
		};
		addEventListener('copydata', (mode, data) => workBench.push({mode: mode, data: data}));

		let timer = getTickCount() - 3000; // start with 3 seconds off
		this.update = function () {
			// only ever 3 seconds update the entire team
			(!((getTickCount() - timer) < 3000 || (timer = getTickCount()) && false)) && updateOtherProfiles();

			if (!workBench.length) return true; // nothing to do

			let work = workBench.splice(0, workBench.length);
			work.map(function (obj) { // Convert to object, if we can
				let data = obj.data;

				try {
					data = JSON.parse(data);
				} catch (e) {
					/* Dont care if we cant*/
				}
				return {mode: obj.mode, data: data};
			})
				.filter(obj => typeof obj === 'object' && obj)
				.filter(obj => typeof obj.data === 'object' && obj.data)
				.forEach(function (obj) {
					myEvents.trigger(obj.mode, obj.data); // Registered events on the mode
					typeof obj.data === 'object' && obj.data && Object.keys(obj.data).forEach(function (item) {
						obj.data[item].reply = (what, mode) => Team.send(obj.data.profile, what, mode);
						myEvents.trigger(item, obj.data[item]); // Registered events on a data item
					})
				});

			return true; // always, to keep looping;
		}
	}).update;

	const defaultCopyDataMode = 0xC0FFFE;
	const Team = module.exports = {
		on: myEvents.on,
		off: myEvents.off,
		once: myEvents.once,
		send: function (who, what, mode) {
			what.profile = me.windowtitle;
			return sendCopyData(null, who, mode || defaultCopyDataMode, JSON.stringify(what));
		},
		broadcast: (what, mode) => others.forEach(function (other) {
			what.profile = me.windowtitle;
			return sendCopyData(null, other.profile, mode || defaultCopyDataMode, JSON.stringify(what));
		})
	};

})(module, require);