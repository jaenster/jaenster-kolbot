/**
 * @author Jaenster
 * @description This is a template file that simply loads the directory of this file
 */

(function (module, require) {

	const first = (new Error().stack.match(/[^\r\n]+/g)).shift(),
		filename = (fn => fn.substr(0, fn.indexOf('.')))(first.substr(first.lastIndexOf('\\') + 1));

	module.exports = require('./'+filename+'/main');
})(module, require);