(function () {
	const fields = ['x', 'y', 'sizex', 'sizey', 'classid', 'hpmax', 'itemcount', 'ownertype', 'uniqueid', 'code', 'prefixnum', 'suffixnum', 'prefixnums', 'suffixnums', 'fname,quality', 'node', 'location', 'sizex', 'sizey', 'description', 'ilvl', 'lvlreq', 'gfx'];
	Object.defineProperty(Unit.prototype, 'uniqueId', {
		get: function () {
			let text = fields.map(key => (this.hasOwnProperty(key) && this[key] || '').toString()).filter(x => x);
			return md5(JSON.stringify(text));
		}
	});
})();