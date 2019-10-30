/**
 * @description A node like require object.
 * @author Jaenster
 */

if (typeof global === 'undefined') var global = this; // need a var here as a let would block the scope

global['module'] = {exports: undefined};
const require = (function (include, isIncluded, print, notify) {

	let depth = 0;
	const modules = {};
	const obj = (field, path) => {

		path = path || 'modules/';
		const packageName = (path + field).replace(/[^a-z0-9]/gi, '_').toLowerCase();

		if (modules.hasOwnProperty(packageName)) {
			//depth && notify && print('ÿc2Jaensterÿc0 ::    - retrieving cached module: ' + path + field);
			return modules[packageName].exports;
		}

		if (field.hasOwnProperty('endsWith') && field.endsWith('.json')) { // Simply reads a json file
			return modules[packageName] = File.open('libs/'+path + field, 0).readAllLines();
		}

		if (!isIncluded(path + field + '.js')) {
			depth && notify && print('ÿc2Jaensterÿc0 ::    - loading dependency: ' + path + field);
			!depth && notify && print('ÿc2Jaensterÿc0 :: Loading module: ' + path + field);

			let old = Object.create(global['module']);
			delete global['module'];
			global['module'] = {exports: {here: 'failed module'}};

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
			return modules[packageName].exports;

		}
		throw Error('unexpected module error -- ' + field);
	};
	obj.modules = modules;
	return obj;
})(include, isIncluded, print, getScript(true).name.toLowerCase().split('').reverse().splice(0, '.dbj'.length).reverse().join('') === '.dbj');

me.ingame && (function () {
	// If in game, load all libraries too
	!isIncluded('sdk.js') && include('sdk.js');
	!isIncluded('common/Prototypes.js') && include('common/Prototypes.js'); // Ensure prototypes are loaded
	const fileList = dopen("libs/unit").getFiles();
	Array.isArray(fileList) && fileList
		.filter(file => file.endsWith('.js'))
		.forEach(x => !isIncluded('unit/' + x) && include('unit/' + x));
}).call();