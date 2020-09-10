(function (module, require) {

	const globalDebugLines = [].filter.constructor('return this;')()[md5('arcancedebuglines')] = [];

	const walkTo = (walkTo => {
		return function (...args) {

			// disable teleporting for now
			if (args.length === 1) {
				args.push(false);
			} else {
				args[1] = false;
			}
			walkTo.apply(this, args);
		}
	})(require('./WalkTo'));

	const portalIds = [192, 304, 306, 305];

	const wPath = (to, from = me) => getPath(sdk.areas.ArcaneSanctuary, from.x, from.y, to.x, to.y, 0, 5);
	const tPath = (to, from = me) => getPath(sdk.areas.ArcaneSanctuary, from.x, from.y, to.x, to.y, 1, 20);

	module.exports = function (endPoint) {

		const Pather = require('../../../modules/Pather');
		const Misc = require('../../../modules/Misc');

		const takePortal = portal => Misc.poll(() => {
			portal.click();
			console.debug(getCollision(me.area, me.x, me.y, portal.x, portal.y));
			return getCollision(me.area, me.x, me.y, portal.x, portal.y) !== 0;
		});


		Pather.journeyTo(sdk.areas.ArcaneSanctuary);

		console.debug('Generating path');
		const path = tPath(endPoint);

		// Debug nodes
		path.map(node => globalDebugLines.push(new X(node, 12, 4)));

		path.map((from, i, self) => {

			if (i === self.length - 1) return false;

			const to = self[i + 1];
			const toNext = i + 2 < self.length ? self[i + 2] : false;


			const walkpath = wPath(to, from);

			if (!walkpath.length) {
				console.debug('Nope, cant walk, need to take a portal');
				let door;
				for (let i = 0; i < 5 || !door; i++) {
					i && console.debug('Attempt #' + i);
					const portals = getUnits(2).filter(u => portalIds.includes(u.classid)),
						here = portals.filter(u => (wPath(u, me) || []).length),
						there = portals.filter(u => (wPath(u, to) || []).length || toNext && (wPath(u, toNext) || []).length).sort((a, b) => getDistance(b, to.x, to.y) - getDistance(a, to.x, to.y));

					console.debug('portals here ', here.length);
					console.debug('portals there ', there.length);
					// there.map((node, i, self) => i && globalDebugLines.push(new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x84, true)));

					// Search the other door
					door = there.find((self, i) => {
						const other = here.slice().sort((a, b) => getDistance(a, self) - getDistance(b, self)).find(o => o.classid === self.classid);

						console.debug(other);
						if (other && getDistance(other, self) < 60) {
							console.debug('Found possible other exit door -- ', getDistance(other, self));
							self.other = other;
							other.other = self;
							globalDebugLines.push(new Line(other.x, other.y, self.x, self.y, 0x84, true));
							return true;
						}
					});

					if (door) break;

					// Sometimes doors are really close to eachother, so close our node doesnt hop between it
					if (!door && here.length && there.length) {
						console.debug('tricky portal');

						// We dont know exactly what to do.
						// Just take the portal that is _nearest_ to the next exit
						const nearestHere = here.slice().sort((a, b) => getDistance(a, to) - getDistance(b, to)).first();
						console.debug(nearestHere);
						walkTo({
							x: nearestHere.x,
							y: nearestHere.y,
						});
						console.debug('Taking portal?');
						takePortal(nearestHere);
					}
				}

				if (door) {
					const local = door.other;
					console.debug('Walking to local');
					walkTo(local);

					takePortal(local);

					print('Took portal eh?');
				} else {
					console.debug('No such portal =(');
					while (true) delay(1000);
				}
			} else {
				console.debug(walkpath);
				walkpath.map((node, i, self) => i && globalDebugLines.push(new Line(self[i - 1].x, self[i - 1].y, node.x, node.y, 0x99, true)));

				walkTo(to, false);

			}

		})

	};


	const X = function (node, color, scale = 2, zorder = 1) {
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
		node && this.offset(node.x, node.y);
	};
})(module, require);