/**
 * @description A node like require function.
 * @author Jaenster
 */

!isIncluded('polyfill.js') && include('polyfill.js');

// noinspection ThisExpressionReferencesGlobalObjectJS <-- definition of global here
typeof global === 'undefined' && (this['global'] = this);

global['module'] = {exports: undefined};
global['exports'] = {};

function removeRelativePath(test) {
	return test.replace(/\\/g, '/').split('/').reduce(function (acc, cur) {
		if (!cur || cur === '.') return acc;
		if (cur === '..') {
			acc.pop();
			return acc;
		}
		acc.push(cur);
		return acc;

	}, []).join('/');
}

[].filter.constructor('return this')()['require'] = (function (include, isIncluded, print, notify) {


	let depth = 0;
	const modules = {};
	const obj = function require(field, path, debug) {
		const stack = new Error().stack.match(/[^\r\n]+/g);
		let directory, filename;
		try {
			directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj|console):/)[1].replace('\\', '/') + '/';
			filename = stack[1].match(/.*?@.*?d2bs\\kolbot\\?(.*)(\.js|\.dbj|console):/)[1];

			filename = filename.substr(filename.length - filename.split('').reverse().join('').indexOf('\\'));
		} catch (e) {
			print('ERROR WTF');
			print('                 ' + e.message);
			print('                 ' + e.stack);
		}
		let appendUpperFolder = !removeRelativePath(directory + field).startsWith('kolbot/libs');

		// remove the name kolbot of the file
		if (directory.startsWith('kolbot')) {
			directory = directory.substr('kolbot'.length);
		}

		// remove the / from it
		if (directory.startsWith('/')) {
			directory = directory.substr(1);
		}

		// strip off lib
		if (directory.startsWith('lib')) {
			directory = directory.substr(4);
		} else {
			directory = '../' + directory; // Add a extra recursive path, as we start out of the lib directory
		}

		path = path || directory;

		let fullpath = removeRelativePath((path + field).replace(/\\/, '/')).toLowerCase();
		// remove lib again, if required in e.g. kolbot\tools but wants modules\whatever
		if (fullpath.startsWith('lib')) {
			fullpath = fullpath.substr(4);
		}

		if (appendUpperFolder) {
			fullpath = '../' + fullpath;
		}

		const packageName = fullpath;

		const asNew = this.__proto__.constructor === require && ((...args) => new (Function.prototype.bind.apply(modules[packageName].exports, args)));

		if (field.hasOwnProperty('endsWith') && field.endsWith('.json')) { // Simply reads a json file
			return modules[packageName] = File.open('libs/' + path + field, 0).readAllLines();
		}

		const match = (fullpath + '.js').match(/.*?\/(\w*).js$/);
		if (!match) {
			(function () {
				const err = new Error('module "' + fullpath + '.js" not found');
				print('error eh');

				const myStack = err.stack.match(/[^\r\n]+/g);
				err.fileName = directory + myStack[2].match(/.*?@.*?d2bs\\kolbot\\?(.*)(\.js|\.dbj):/)[1];
				err.lineNumber = myStack[2].substr(stack[1].lastIndexOf(':') + 1);
				print(err.fileName + ':' + err.lineNumber + ' module ' + fullpath + ' not found');
				throw new Error(err.fileName + '.js' + ':' + err.lineNumber + ' module ' + fullpath + ' not found');
			})();
		}
		const moduleNameShort = match[1];

		if (!isIncluded(fullpath + '.js') && !modules.hasOwnProperty(moduleNameShort)) {
			depth && notify && print('ÿc2Kolbotÿc0 ::    - loading dependency of ' + filename + ': ' + moduleNameShort);
			!depth && notify && print('ÿc2Kolbotÿc0 :: Loading module: ' + moduleNameShort);

			let oldModule = Object.create(global['module']);
			let oldExports = Object.create(global['exports']);
			delete global['module'];
			delete global['exports'];
			global['module'] = {exports: null};
			global['exports'] = {};

			// Include the file;
			try {
				depth++;
				if (!include(fullpath + '.js')) {
					const err = new Error('module ' + fullpath + ' not found');

					// Rewrite the location of the error, to be more clear for the developer/user _where_ it crashes
					// const myStack = err.stack.match(/[^\r\n]+/g);
					// err.fileName = directory + myStack[1].match(/.*?@.*?d2bs\\kolbot\\?(.*)(\.js|\.dbj):/)[1];
					// err.lineNumber = myStack[1].substr(stack[1].lastIndexOf(':') + 1);
					// myStack.unshift();
					// err.stack = myStack.join('\r\n'); // rewrite stack
					console.debug((new Error).stack);

					throw err;
				}
			} finally {
				depth--
			}

			if (!global['module']['exports'] && Object.keys(global['exports'])) { // Incase its transpiled typescript
				global['module']['exports'] = global['exports'];
			}

			modules[packageName] = Object.create(global['module']);
			delete global['module'];
			delete global['exports'];
			global['module'] = oldModule;
			global['exports'] = oldExports;
		}

		if (!modules.hasOwnProperty(packageName)) throw Error('unexpected module error -- ' + field);

		// If called as "new", fake an constructor
		return asNew || modules[packageName].exports;
	};
	obj.modules = modules;
	return obj;
})(include, isIncluded, print, getScript(true).name.toLowerCase().split('').reverse().splice(0, '.dbj'.length).reverse().join('') === '.dbj');

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

me.ingame && (function() {
	require('./modules/GameMode');
})();

me.ingame && (function () {
	// If in game, load all libraries too
	!isIncluded('sdk.js') && include('sdk.js');
	const fileList = dopen("libs/unit").getFiles();
	Array.isArray(fileList) && fileList
		.filter(file => file.endsWith('.js'))
		.sort(a => a.startsWith('Item.js') ? 0 : 1) // Dirty fix to load Item first
		.forEach(x => !isIncluded('unit/' + x) && include('unit/' + x));
}).call();