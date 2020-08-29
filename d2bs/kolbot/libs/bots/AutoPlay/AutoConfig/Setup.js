(function (module, require) {
	const loadDirectory = (dir, requireFunc = function (filename, base) {
		return require(dir + '/' + filename, base);
	}) => {
		const stack = new Error().stack.match(/[^\r\n]+/g);
		let directory = stack[1].match(/.*?@.*?d2bs\\(kolbot\\?.*)\\.*(\.js|\.dbj):/)[1].replace('\\', '/') + '/', base;

		// remove the name kolbot of the file
		if (directory.startsWith('kolbot')) {
			directory = directory.substr('kolbot'.length);
		}

		// remove the / from it
		if (directory.startsWith('/')) {
			directory = directory.substr(1);
		}

		base = directory;
		directory += dir; // Add the directory we are searching for
		directory = removeRelativePath(directory);
		const opendDir = dopen(directory);
		const fileList = opendDir.getFiles();

		return (fileList || [])
			.filter(item => item.endsWith('.js'))
			.map(item => item.substr(0, item.length - 3))
			.map(filename => requireFunc(filename, base));
	};

	const ConfigObj = require('./Config');

	const ConfigName = ['Amazon', 'Sorceress', 'Necromancer', 'Paladin', 'Barbarian', 'Druid', 'Assassin'][me.classid];
	// Load possible builds for this char
	loadDirectory('../Builds/' + ConfigName).forEach(build => ConfigObj.builds.push(build));
	require('./' + ConfigName);

	module.exports = ConfigObj;
})(module, require);