/**
 *
 * @description A little script that starts in its own thread so i can preform actions while logging in
 * @author Jaenster
 *
 *
 * @deprecated should not be needed in the future.
 */

(function (module) {
	let currentFile = 'libs/modules/login.js';
	!isIncluded('require.js') && include('require.js');
	const Messaging = require('Messaging');

	if (getScript(currentFile) && getScript(currentFile).name === getScript(true).name) {
		require('Debug'); // new print statements

		Messaging.on('login', function (profile) {
			print('PROFILE: ' + profile);
			profile && login(profile)
		});

		while (true) {
			delay(10);
		}

	} else {
		if (!getScript(currentFile)) {
			load(currentFile);
		}
		module.exports = function (profile) {
			Messaging.send({login: profile});
			delay(1500);
			print('STOPPING IT');
			getScript(currentFile).stop();
		};
	}
})(typeof module === 'object' && module || {exports: {}});
