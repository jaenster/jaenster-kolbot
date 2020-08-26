/**
 * @author Jaenster
 * @description Simple module to hook upon keys
 */


(function (module, require) {
	const myEvents = new (require('../modules/Events')), list = [];

	addEventListener('keyup', key => (key = parseInt(key)) && key && list.indexOf(key) > -1 && myEvents.emit(key));

	(on => myEvents.on = (...args) => {
		list.push(parseInt(args.first()));
		return on.apply(myEvents, args);
	})(myEvents.on);

	module.exports = {
		on: myEvents.on,
		off: myEvents.off,
		once: myEvents.once,
	}
}).call(null, typeof module === 'object' && module || {}, typeof require === 'undefined' && (include('require.js') && require) || require);