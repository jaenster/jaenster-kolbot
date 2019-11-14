/**
 * @author Jaenster
 * @description Simple module to hook upon keys
 */


(function () {
	const Messaging = require('Messaging');
	if (getScript.startAsThread() === 'thread') {
		const list = [];

		Messaging.on('Hotkey', data => typeof data.register === "number" && list.push(parseInt(data.register)));

		addEventListener('keyup', key => (key = parseInt(key)) && key && list.indexOf(key) > -1 && Messaging.send({Hotkey: {emit: key}}));

		while (true) delay(100);

	} else {
		const myEvents = new (require('Events'));

		Messaging.on('Hotkey', data => data.hasOwnProperty('emit') && myEvents.emit(data.emit) || myEvents.emit(null, data.emit));

		(on => myEvents.on = args => Messaging.send({Hotkey: {data: ([key] = [args])}}) || on.apply(myEvents, args))(myEvents.on);

		module.exports = {
			on: myEvents.on,
			off: myEvents.off,
			once: myEvents.once,
		}
	}
}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);