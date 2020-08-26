/**
 * @description Packet handlers. Event driven packets.
 * @author Jaenster
 */


{ // blocked scope
	switch (getScript.startAsThread()) {
		case 'thread':
			(function (require) {
				const Packet = require('../modules/require.js');
			})(include('require.js') && require);
			break;
		case 'loaded':
		case 'started':
			print('thread started/loaded');
			(function (module, require) {

			})(module, require);
	}
}
