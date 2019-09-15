/**
 *  @file maphack.js
 *  @author    Nishimura-Katsuo, Jaenster
 *  @description a more useful maphack
 */

function MapHack() {
	const GameData = require('GameData');
	Worker = require('Worker');

	const isAlive = GameData.isAlive,
		isEnemy = GameData.isEnemy,
		onGround = GameData.onGround,
		PresetMonsters = GameData.PresetMonsters,
		itemTier = GameData.itemTier
	;

	const deltas = {
		values: [],
		track: function (checkerFn, callback) {
			this.values.push({fn: checkerFn, callback: callback, value: checkerFn()});
		},
		check: function () {
			this.values.some(delta => {
				let val = delta.fn();

				if (delta.value !== val) {
					let ret = delta.callback(delta.value, val);
					delta.value = val;

					return ret;
				}

				return null;
			});
		}
	};

	/*
Usage:
new Shape(arg, arg, arg...); // creates a new shape and constructs shape if args exist
Shape.draw(arg, arg, arg...); // adds to current shape
	arg = number (color) |
		  boolean (true = close shape, false = don't close shape) |
		  array ([x, y]) |
		  object ({x: x, y: y})
Shape.build(faces)
	faces = number (number of faces) |
		  "triangle" | "square" | "diamond" | "pentagon" |
		  "hexagon" | "heptagon" | "octagon" | "arrow"
Shape.offset(x, y) // offset coords by this amount
Shape.angle(A) // sets angle of rotation to A radians
Shape.scale(size) // sets scaling of shape to size
Shape.scale(width, height) // sets x scaling to width, y scaling to height
Shape.clear(); // completely clears existing shape
Example:
let s = new Shape(true, 0x62, [me.x+10, me.y], [me.x, me.y+10], [me.x-10, me.y], [me.x, me.y-10]);
Example:
let s = new Shape(0x62); // use red
s.offset(me.x, me.y);
s.scale(10);
s.build(12); // like a cheap circle
s.angle(Math.PI / 2); // rotate by 1/4 circle
Example:
let s = new Shape(0x99); // use blue
s.offset(me.x, me.x);
s.scale(10);
s.build("arrow");
s.angle(math.atan2(pointhere.x-me.x,pointhere.y-me.y));
*/

	const X = function (color, scale = 2, zorder = 1) {
		let a, b;

		this.offset = (x, y) => {
			if (a && b) {
				a.x = a.x2 = x;
				a.y = y - scale;
				a.y2 = y + scale;
				b.y = b.y2 = y;
				b.x = x - scale;
				b.x2 = x + scale;
			} else {
				this.clear();
				a = new Line(x, y - scale, x, y + scale, color, true);
				b = new Line(x - scale, y, x + scale, y, color, true);
				a.zorder = b.zorder = zorder;
			}
		};

		this.clear = () => {
			a && a.remove();
			b && b.remove();
			a = b = null;
		};
	};

	const Shape = function () {
		if (this.__proto__.constructor !== Shape) {
			throw new Error("Shape must be called with 'new' operator!");
		}

		let connected = false;
		let color = 0x68;
		let vertices = [];
		let lines = [];
		let offset = {x: 0, y: 0};
		let cs = Math.sin(0), cc = Math.cos(0); // sin and cos for rotation, default is 0
		let scalex = 1, scaley = 1;
		let fixCoord = Math.round.bind(Math);

		let drawLines = () => {
			let i = 0;

			for (i = 0; i < vertices.length - 1; i++) {
				if (lines[i]) {
					lines[i].x = fixCoord((vertices[i].x * scalex * cc - vertices[i].y * scaley * cs) + offset.x);
					lines[i].y = fixCoord((vertices[i].x * scalex * cs + vertices[i].y * scaley * cc) + offset.y);
					lines[i].x2 = fixCoord((vertices[i + 1].x * scalex * cc - vertices[i + 1].y * scaley * cs) + offset.x);
					lines[i].y2 = fixCoord((vertices[i + 1].x * scalex * cs + vertices[i + 1].y * scaley * cc) + offset.y);
				} else {
					lines[i] = new Line(fixCoord((vertices[i].x * scalex * cc - vertices[i].y * scaley * cs) + offset.x), fixCoord((vertices[i].x * scalex * cs + vertices[i].y * scaley * cc) + offset.y), fixCoord((vertices[i + 1].x * scalex * cc - vertices[i + 1].y * scaley * cs) + offset.x), fixCoord((vertices[i + 1].x * scalex * cs + vertices[i + 1].y * scaley * cc) + offset.y), vertices[i + 1].color, true);
				}
			}

			if (connected && vertices.length > 2) {
				if (lines[i]) {
					lines[i].x = fixCoord((vertices[i].x * scalex * cc - vertices[i].y * scaley * cs) + offset.x);
					lines[i].y = fixCoord((vertices[i].x * scalex * cs + vertices[i].y * scaley * cc) + offset.y);
					lines[i].x2 = fixCoord((vertices[0].x * scalex * cc - vertices[0].y * scaley * cs) + offset.x);
					lines[i].y2 = fixCoord((vertices[0].x * scalex * cs + vertices[0].y * scaley * cc) + offset.y);
				} else {
					lines[i] = new Line(fixCoord((vertices[i].x * scalex * cc - vertices[i].y * scaley * cs) + offset.x), fixCoord((vertices[i].x * scalex * cs + vertices[i].y * scaley * cc) + offset.y), fixCoord((vertices[0].x * scalex * cc - vertices[0].y * scaley * cs) + offset.x), fixCoord((vertices[0].x * scalex * cs + vertices[0].y * scaley * cc) + offset.y), vertices[0].color, true);
				}

				i++;
			}

			for (; i < lines.length; i++) { // clean up unused lines if any
				if (lines[i]) {
					lines[i].remove();
					delete lines[i];
				}
			}
		};

		let useArg = (arg) => {
			switch (typeof arg) {
				case "number":
					color = arg;
					break;
				case "object":
					if (arg.x !== undefined && arg.y !== undefined) {
						vertices.push({x: arg.x, y: arg.y, color: color});
					} else if (arg[0] !== undefined && arg[1] !== undefined) {
						vertices.push({x: arg[0], y: arg[1], color: color});
					} else {
						throw new Error("Unknown argument type");
					}

					drawLines();

					break;
				case "boolean":
					connected = arg;
					drawLines();
					break;
				default:
					throw new Error("Unknown argument type");
			}
		};

		for (let c = 0; c < arguments.length; c++) {
			useArg(arguments[c]);
		}

		this.offset = (x, y) => {
			offset.x = x;
			offset.y = y;
			drawLines();
		};

		this.draw = function () {
			if (arguments.length < 1) {
				drawLines();
			} else {
				for (let c = 0; c < arguments.length; c++) {
					useArg(arguments[c]);
				}
			}
		};

		this.clear = function () {
			lines.forEach(line => line.remove());
			lines = [];
			vertices = [];
		};

		this.angle = function (angle) { // in radians
			cc = Math.cos(angle);
			cs = Math.sin(angle);
			drawLines();
		};

		this.pointAt = function (x, y) {
			cc = x - offset.x;
			cs = y - offset.y;
			let r = Math.sqrt(cc * cc + cs * cs);
			cc /= r;
			cs /= r;
			drawLines();
		};

		this.scale = function (x, y) {
			let drawit = false;

			if (y === undefined && x) {
				y = x;
			}

			if (x) {
				scalex = x;
				drawit = true;
			}

			if (y) {
				scaley = y;
				drawit = true;
			}

			if (drawit) {
				drawLines();
			}
		};

		this.build = function (shape, shapedetail) { // rotate is in radians
			let sides = 0, rotate = 0;

			switch (shape) {
				case "triangle":
					sides = 3;
					break;
				case "square":
					sides = 4;
					rotate += Math.PI / 4;
					break;
				case "diamond":
					sides = 4;
					break;
				case "pentagon":
					sides = 5;
					break;
				case "hexagon":
					sides = 6;
					break;
				case "heptagon":
					sides = 7;
					break;
				case "octagon":
					sides = 8;
					break;
				case "cross":
					vertices.push({x: 1, y: 3, color: color});
					vertices.push({x: 1, y: 1, color: color});
					vertices.push({x: 3, y: 1, color: color});
					vertices.push({x: 3, y: -1, color: color});
					vertices.push({x: 1, y: -1, color: color});
					vertices.push({x: 1, y: -3, color: color});
					vertices.push({x: -1, y: -3, color: color});
					vertices.push({x: -1, y: -1, color: color});
					vertices.push({x: -3, y: -1, color: color});
					vertices.push({x: -3, y: 1, color: color});
					vertices.push({x: -1, y: 1, color: color});
					vertices.push({x: -1, y: 3, color: color});
					connected = true;
					drawLines();

					return;
				case "arrow":
					this.clear();

					if (shapedetail === undefined) {
						shapedetail = 1 / 2;
					}

					vertices.push({x: 1, y: 0, color: color});
					vertices.push({x: 0, y: 1, color: color});
					vertices.push({x: 0, y: shapedetail, color: color});
					vertices.push({x: -1, y: shapedetail, color: color});
					vertices.push({x: -1, y: -shapedetail, color: color});
					vertices.push({x: 0, y: -shapedetail, color: color});
					vertices.push({x: 0, y: -1, color: color});
					connected = true;
					drawLines();

					return;
				default:
					if (typeof shape === 'number') {
						sides = shape;
					}

					break;
			}

			if (sides > 1) {
				let freq = Math.PI * 2 / sides;

				this.clear();

				for (let angle = 0; angle < Math.PI * 2; angle += freq) {
					vertices.push({x: Math.cos(angle + rotate), y: Math.sin(angle + rotate), color: color});
				}

				connected = true;
				drawLines();
			}
		};
	};

	let objects = {};
	let items = {};
	let otherShapes = [];
	let POI = [];
	let keyMap = [
		{key: 5, hotkey: 53}, // digit 5 = key
		{key: 6, hotkey: 54},
		{key: 7, hotkey: 55},
		{key: 8, hotkey: 56},
		{key: 9, hotkey: 57},
		{key: 'z', hotkey: 90},
		{key: 'x', hotkey: 88},

	];

	Worker.runInBackground.Overview = (new function () {
		let self = this, startXP = me.getStat(13);

		/**
		 * @constructor
		 * @param {function():string} callback
		 */
		function updateableText(callback) {
			let element = new Text(callback(), self.x + 15, self.y + (7 * self.hooks.length), 0, 12, 2);
			self.hooks.push(element);
			this.update = () => element.text = callback();
		}

		this.hooks = [];
		let frameXsize = 200;
		this.x = 800 - (frameXsize / 2);
		this.y = 350;

		this.hooks.push(new updateableText(() => 'Experience: ' + Math.floor(me.getStat(13) / 1000 / 1000) + 'm'));
		this.hooks.push(new updateableText(() => 'Gained this run: ' + Math.floor((me.getStat(13) - startXP) / 1000) + 'k'));

		keyMap.forEach((map, i) => this.hooks.push(new updateableText(() => (i < POI.length) && (map.key + ': ' + POI[i].name) || '')));

		this.hooks[this.hooks.length - 2].zorder = 0;

		this.update = () => this.hooks.filter(hook => hook.hasOwnProperty('update') && typeof hook.update === 'function' && hook.update());

		return true; // Always return true to keep it running
	}).update;

	Worker.runInBackground.getWp = (function () {
		if (me.inTown) return true;
		let wp = getUnit(2, "waypoint");
		// click the bloodly waypoint if we dont have it yet
		wp && !getWaypoint(Pather.wpAreas.indexOf(wp.area)) && Pather.moveToUnit(wp) && wp.interact();
		return true; // always keep running;
	});

	Worker.runInBackground.AutoBo = (function () {
		Worker.push(() => {
			let hands = [2, 3].map(x => me.getSkill(x)), success;
			if (!me.inTown) {
				success |= require('Precast').call();
			} else {
				success |= require('TownPrecast').prepare();
			}
			success && hands.forEach((sk, hand) => me.setSkill(sk, hand)); // put hand back
		});
		return true;
	});

	Worker.runInBackground.pickit = (function () {
		Pickit.pickItems();
		return true;
	});

	(function () {
		let pressed = [];
		addEventListener('keydown', key => keyMap.map(x => x.hotkey).indexOf(key) !== -1 && pressed.push(key));
		addEventListener('keydown', key => print(key));

		Worker.runInBackground.hotkey = function () {
			if (!pressed.length) return true;
			let hotkey = pressed.shift();
			keyMap.some((k, i) => {
				print(hotkey === k.hotkey);
				if (k.hotkey === hotkey
					&& POI.hasOwnProperty(i)
					&& POI[i].hasOwnProperty('handler')) {
					POI[i].handler();
					return true
				}
				return false;
			});
			return true; // keep running
		}
	})();

	function revealArea() {
		let r = getRoom();

		if (!r) {
			return false;
		}
		let correctTomb = r.correcttomb;

		revealLevel(true);

		let ex = getArea().exits.sort((a, b) => a.target - b.target);

		otherShapes.forEach(line => line.clear());
		otherShapes = [];
		POI = [];

		for (let e = 0; e < ex.length; e++) {
			let sh = new Shape(ex[e].target === correctTomb || ex[e].target === 17 ? 0x7D : 0x99);
			sh.build(8);
			sh.scale(4);
			sh.offset(ex[e].x, ex[e].y);
			otherShapes.push(sh);
			(e => POI.push({ // Add all exits as points of intresst
				handler: () => Pather.moveToExit(ex[e].target, true),
				name: 'goto ' + Pather.getAreaName(ex[e].target),
			}))(e);
		}

		let pu = getPresetUnits(me.area, 1), exclude = [];
		let redPortals = getPresetUnits(me.area, 2, 60); // get unique portals

		pu.filter(p => PresetMonsters.hasOwnProperty(p.id) && !PresetMonsters[p.id].NPC && PresetMonsters[p.id].Killable && p.id <= 805)
			.forEach((p, i) => {
				let dupe = pu.filter(p => PresetMonsters.hasOwnProperty(p.id) && !PresetMonsters[p.id].NPC && PresetMonsters[p.id].Killable && p.id <= 805)
					.some((u, j) => i !== j && PresetMonsters[p.id].LocaleString === PresetMonsters[u.id].LocaleString);
				if (dupe) {
					exclude.push(PresetMonsters[p.id].LocaleString);
				}
			});

		exclude = exclude.filter((p, i) => exclude.indexOf(p) === i); // filter out duplicates

		pu = pu.concat(redPortals);

		for (let i = 0; i < pu.length; i++) {
			if (PresetMonsters[pu[i].id] && !PresetMonsters[pu[i].id].NPC && PresetMonsters[pu[i].id].Killable && pu[i].id <= 805) {
				let pname = PresetMonsters[pu[i].id].LocaleString;
				if (exclude.indexOf(pname) === -1) pname !== undefined && (p => POI.push({
					handler: () => {
						Pather.moveTo(p.roomx * 5 + p.x, p.roomy * 5 + p.y);
						print(p);
					},
					name: 'goto ' + pname,
				}))(pu[i]);

				let sh = new Shape(0xA8);
				sh.build(8);
				sh.scale(8);
				sh.offset(pu[i].roomx * 5 + pu[i].x, pu[i].roomy * 5 + pu[i].y);
				otherShapes.push(sh);
			}
		}

		const toWaypoint = () => [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539].some(id => (preset => preset && Pather.moveToUnit(preset))(getPresetUnit(me.area, 2, id)));
		// Waypoint!
		if (Pather.wpAreas.indexOf(me.area) > -1) {
			POI.unshift({
				handler: () => toWaypoint,
				name: 'goto waypoint',
			})
		}
		let target;
		switch (me.area) {
			case sdk.areas.WorldstoneLvl1:
				!getWaypoint(sdk.areas.WorldstoneLvl2) && POI.unshift({ // Get wp of WorldStoneLvl2, if we dont have it yet
					handler: () => Pather.moveToExit([sdk.areas.WorldstoneLvl2], true) && toWaypoint(),
					name: () => 'Waypoint Worldstone lvl 2',
				});
				break;
			case sdk.areas.CatacombsLvl2:
				POI.unshift({
					handler: () => Pather.moveToExit([sdk.areas.CatacombsLvl3, sdk.areas.CatacombsLvl4], true),
					name: () => 'Catacombs 4',
				});
				break;
			case sdk.areas.FarOasis:
				POI.unshift({
					handler: () => Pather.journeyTo(sdk.areas.MaggotLairLvl3) && Pather.moveToPreset(me.area, 2, 356),
					name: () => 'Maggot Lair level 3',
				});

		}


		return true;
	}

	function isGoodItem(item) {
		if (item.quality > 3 || (item.quality === 3 && itemTier(item) === 2)) {
			return [255, 29, 30, 32, 151, 132, 111, 155, 111][item.quality];
		}

		if (item.itemType >= 96 && item.itemType <= 102 || item.itemType === 74) {
			return 169;
		}

		return 0;
	}

	function itemPriority(item) {
		if (item.itemType >= 96 && item.itemType <= 102) {
			return 5;
		}

		if (item.itemType === 74) {
			return 6;
		}

		return item.quality;
	}

	function update() {
		for (let o in objects) {
			objects[o].unit = null;
		}

		let newunit = getUnit(1);

		if (newunit) {
			do {
				if (!objects[newunit.gid]) {
					objects[newunit.gid] = {};
				}

				objects[newunit.gid].unit = copyUnit(newunit);
			} while (newunit.getNext());
		}

		for (let o in objects) {
			if (objects[o].unit && isEnemy(objects[o].unit)) {
				if (!objects[o].shape) {
					objects[o].shape = new X(((objects[o].unit.spectype & 0x7) ? 12 : (objects[o].unit.spectype & 0xF) ? 11 : 10), 4);
				}

				objects[o].shape.offset(objects[o].unit.x, objects[o].unit.y);
			} else {
				if (objects[o].shape) {
					objects[o].shape.clear();
				}

				delete objects[o];
			}
		}

		for (let i in items) {
			items[i].unit = null;
		}

		newunit = getUnit(4);

		if (newunit) {
			do {
				if (!items[newunit.gid]) {
					items[newunit.gid] = {};
				}

				items[newunit.gid].unit = copyUnit(newunit);
			} while (newunit.getNext());
		}

		for (let i in items) {
			if (items[i].unit && onGround(items[i].unit) && isGoodItem(items[i].unit)) {
				if (!items[i].shape) {
					items[i].shape = new X(isGoodItem(items[i].unit), 4, itemPriority(items[i].unit));
					items[i].shape.offset(items[i].unit.x, items[i].unit.y);
				}
			} else {
				if (items[i].shape) {
					items[i].shape.clear();
				}

				delete items[i];
			}
		}
	}

	let unit = getUnit(1), revealTime = 7;

	if (unit) {
		do {
			if (isEnemy(unit)) {
				objects[unit.gid] = {};
			}
		} while (unit.getNext());
	}

	deltas.track(() => me.area, () => revealTime = 7);

	print('loaded!');

	Worker.runInBackground.checker = function () {
		if (me.gameReady && revealTime) {
			if (!--revealTime) {
				if (!revealArea()) {
					revealTime = 7;
				}
			}
		}

		deltas.check();
		update();
		return true; // always do this
	};

	Worker.runInBackground.stamina = function () {
		if (typeof me === 'undefined') return true; // happens when we are dead

		if (me.runwalk === 1 && me.stamina / me.staminamax * 100 <= 25) {
			//{"type":4,"classid":513,"mode":0,"name":"Stamina Potion","act":1,"gid":6,"x":8,"y":1,"hp":0,"hpmax":0,"mp":0,"mpmax":0,"stamina":0,"staminamax":0,"charlvl":0,"owner":0,"ownertype":0,"uniqueid":-1,"code":"vps","prefixes":[],"suffixes":[],"prefixnum":0,"suffixnum":0,"prefixnums":[],"suffixnums":[],"fname":"Stamina Potion","quality":2,"node":1,"location":3,"sizex":1,"sizey":1,"itemType":79,"description":"ÿc0Stamina Potion","bodylocation":0,"ilvl":1,"lvlreq":0,"gfx":0}
			let pot = me.getItems(-1).filter(i => i.classid === 513 && i.location === 3 || i.location === 2).sort((a, b) => a.location - b.location).first();
			pot && pot.interact(); // interact with pot (aka click on it)

		}
	};

	while (me.ingame) {
		delay(40);
	}
};