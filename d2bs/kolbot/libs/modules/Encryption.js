/**
 * @description A simple XOR encryption in native javascript
 * @author Jaenster
 *
 */


(function (module, require) {

	module.exports = {

		/** @param {string} data;
		 * @param {string} cypher
		 * @return {string} */
		encrypt: (data, cypher) => Array.from(data).map((v, i) => String.fromCharCode(v.charCodeAt(0) ^ cypher.charCodeAt(i % cypher.length))).join(''),

		/** @param {string} input
		 * @returns {string}
		 */
		pack: input => Array.from(input).map(char => ("000" + char.charCodeAt(0).toString(16)).slice(-4)).join(''),

		/** @param {string} input -- hex'd string
		 * @returns {string}
		 */
		unpack: input => (input.match(/.{1,4}/g) || []).map(hex => String.fromCharCode(parseInt(hex, 16))).join(''),
	};

	/*
		Tested in node

		console.log(module.exports.unpack(module.exports.pack('test')));
		console.log(module.exports.encrypt(module.exports.encrypt('test', 'supersecret'), 'supersecret'));
	 */
}).call(null, module, require);