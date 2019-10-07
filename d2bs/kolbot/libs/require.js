/**
 * @description A node like require object.
 * @author Jaenster
 */

if (typeof global === 'undefined') var global = this; // need a var here as a let would block the scope

global['module'] = {exports: undefined};
const require = (function (include, isIncluded, print, notify) {
    let depth = 0;
	const packages = {};
    return (field, path) => {

        path = path || 'modules/';
		const packageName = (path + field).replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (packages.hasOwnProperty(packageName)) {
			//depth && notify && print('ÿc2Jaensterÿc0 ::    - retrieving cached module: ' + path + field);
            return packages[packageName].exports;
        }

        if (!isIncluded(path + field + '.js')) {
			depth && notify && print('ÿc2Jaensterÿc0 ::    - loading dependency: ' + path + field);
			!depth && notify && print('ÿc2Jaensterÿc0 :: Loading module: ' + path + field);
            depth++;

            let old = Object.create(global['module']);
            delete global['module'];
            global['module'] = {exports: {here: 'failed module'}};

            // Include the file;
            try {
                if (!include(path + field + '.js')) {
                    throw Error('module ' + field + ' not found');
                }
            } finally {
                depth--
            }

            packages[packageName] = Object.create(global['module']);
            delete global['module'];

            global['module'] = old;
            return packages[packageName].exports;

        }
        throw Error('unexpected module error -- ' + field);
    }
})(include, isIncluded, print, getScript(true).name.toLowerCase().split('').reverse().splice(0, '.dbj'.length).reverse().join('') === '.dbj');