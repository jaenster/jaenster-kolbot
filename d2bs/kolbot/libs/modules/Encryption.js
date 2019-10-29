/**
 * @description A simple XOR encryption in native javascript
 * @author Jaenster
 *
 */


(function (module, require) {

	/** @param {string} data;
	 * @param {string} cypher
	 * @return {string} */
	const encrypt =
		(data, cypher) => Array.from(data).map((v, i) => String.fromCharCode(v.charCodeAt(0) ^ cypher.charCodeAt(i % cypher.length))).join('');

	/** @param {string} input
	 * @returns {string}
	 */
	encrypt.pack = input => Array.from(input).map(char => ("000" + char.charCodeAt(0).toString(16)).slice(-4)).join('');

	/** @param {string} input -- hex'd string
	 * @returns {string}
	 */
	encrypt.unpack = input => (input.match(/.{1,4}/g) || []).map(hex => String.fromCharCode(parseInt(hex, 16))).join('');

	module.exports = encrypt;

	/*
		Tested in node

		console.log(encrypt.unpack(encrypt.pack('test')));
		console.log(encrypt(encrypt('test', 'supersecret'), 'supersecret'));
	 */
}).call(null, module, require);