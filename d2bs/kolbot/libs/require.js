/**
 * @description A node like require object.
 * @author Jaenster
 */

!isIncluded('polyfill.js') && include('polyfill.js');
if (typeof global === 'undefined') this['global'] = this; // need a var here as a let would block the scope

global['module'] = {exports: undefined};
const require = (function (include, isIncluded, print, notify) {

	let depth = 0;
	const modules = {};
	const obj = function require(field, path) {
		const asNew = this.__proto__.constructor === require && ((...args) => new (Function.prototype.bind.apply(modules[packageName].exports, args)));

		path = path || 'modules/';
		const packageName = (path + field).replace(/[^a-z0-9]/gi, '_').toLowerCase();

		if (field.hasOwnProperty('endsWith') && field.endsWith('.json')) { // Simply reads a json file
			return modules[packageName] = File.open('libs/' + path + field, 0).readAllLines();
		}

		if (!isIncluded(path + field + '.js')) {
			depth && notify && print('ÿc2Jaensterÿc0 ::    - loading dependency: ' + path + field);
			!depth && notify && print('ÿc2Jaensterÿc0 :: Loading module: ' + path + field);

			let old = Object.create(global['module']);
			delete global['module'];
			global['module'] = {exports: undefined};

			// Include the file;
			try {
				depth++;
				if (!include(path + field + '.js')) {
					throw Error('module ' + field + ' not found');
				}
			} finally {
				depth--
			}

			modules[packageName] = Object.create(global['module']);
			delete global['module'];

			global['module'] = old;
		}

		if (!modules.hasOwnProperty(packageName)) throw Error('unexpected module error -- ' + field);

		// If called as "new", fake an constructor
		return asNew || modules[packageName].exports;
	};
	obj.modules = modules;
	return obj;
})(include, isIncluded, print, getScript(true).name.toLowerCase().split('').reverse().splice(0, '.dbj'.length).reverse().join('') === '.dbj');

me.ingame && (function () {
	// If in game, load all libraries too
	!isIncluded('sdk.js') && include('sdk.js');
	const fileList = dopen("libs/unit").getFiles();
	Array.isArray(fileList) && fileList
		.filter(file => file.endsWith('.js'))
		.forEach(x => !isIncluded('unit/' + x) && include('unit/' + x));
}).call();

getScript.startAsThread = function () {
	let stack = new Error().stack.match(/[^\r\n]+/g),
		filename = stack[1].match(/.*?@.*?d2bs\\kolbot\\(.*):/)[1];

	if (getScript(true).name.toLowerCase() === filename.toLowerCase()) {
		return 'thread';
	}

	if (!getScript(filename)) {
		load(filename);
		return 'started';
	}

	return 'loaded';
};
