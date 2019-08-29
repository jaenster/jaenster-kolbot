/**
 *    @filename    Storage.js
 *    @author        McGod, kolton (small kolbot related edits), jaenster
 *    @desc        manage inventory, belt, stash, cube
 */
(function (module, require) {
	/** @type Container[] */
	const Containers = [];
	/** @constructor */
	const Container = function (name, width, height, location) {
		this.name = name;
		this.width = width;
		this.height = height;
		this.location = location;
		this.buffer = [];
		this.itemList = [];
		this.openPositions = this.height * this.width;
		Containers.push(this);

		// Initalize the buffer array for use, set all as empty.
		for (let h = 0; h < this.height; h += 1) {
			this.buffer.push([]);

			for (let w = 0; w < this.width; w += 1) {
				this.buffer[h][w] = 0;
			}
		}

		/* Container.Mark(item)
		 *	Marks the item in the buffer, and adds it to the item list.
		 */
		this.Mark = function (item) {
			//Make sure it is in this container.
			if (item.location !== this.location || item.mode !== 0) {
				return false;
			}

			//Mark item in buffer.
			for (let x = item.x; x < (item.x + item.sizex); x += 1) {
				for (let y = item.y; y < (item.y + item.sizey); y += 1) {
					this.buffer[y][x] = this.itemList.length + 1;
					this.openPositions--;
				}
			}

			//Add item to list.
			this.itemList.push(copyUnit(item));
			return true;
		};

		/* Container.isLocked(item)
		 *	Checks if the item is in a locked spot
		 */
		this.IsLocked = function (item, baseRef) {
			let reference = baseRef.slice(0);

			//Make sure it is in this container.
			// Make sure the item is ours
			if (item.mode !== 0 || item.location !== this.location
				|| !item.getParent() || item.getParent().type !== me.type || item.getParent().gid !== me.gid) {
				return false;
			}

			//Insure valid reference.
			if (typeof (reference) !== "object" || reference.length !== this.buffer.length || reference[0].length !== this.buffer[0].length) {
				throw new Error("Storage.IsLocked: Invalid inventory reference");
			}

			try {
				// Check if the item lies in a locked spot.
				for (let h = item.y; h < (item.y + item.sizey); h += 1) {
					for (let w = item.x; w < (item.x + item.sizex); w += 1) {
						if (reference[h][w] === 0) {
							return true;
						}
					}
				}
			} catch (e2) {
				throw new Error("Storage.IsLocked error! Item info: " + item.name + " " + item.y + " " + item.sizey + " " + item.x + " " + item.sizex + " " + item.mode + " " + item.location);
			}

			return false;
		};

		this.Reset = function () {
			for (let h = 0; h < this.height; h += 1) {
				for (let w = 0; w < this.width; w += 1) {
					this.buffer[h][w] = 0;
				}
			}

			this.itemList = [];
			return true;
		};

		/* Container.CanFit(item)
		 *	Checks to see if we can fit the item in the buffer.
		 */
		this.CanFit = function (item) {
			return !!this.FindSpot(item);
		};

		/* Container.FindSpot(item)
		 *	Finds a spot available in the buffer to place the item.
		 */
		this.FindSpot = function (item) {
			var x, y, nx, ny;

			//Make sure it's a valid item
			if (!item || !(item instanceof Unit) || item.type !== sdk.unittype.Item) {
				return false;
			}

			Storage.Reload();

			//Loop buffer looking for spot to place item.
			for (y = 0; y < this.width - (item.sizex - 1); y += 1) {
				for (x = 0; x < this.height - (item.sizey - 1); x += 1) {
					//Check if there is something in this spot.
					if (this.buffer[x][y] > 0) continue;

					if ((function () {
						//Loop the item size to make sure we can fit it.
						for (nx = 0; nx < item.sizey; nx += 1) {
							for (ny = 0; ny < item.sizex; ny += 1) {
								if (this.buffer[x + nx][y + ny]) {
									return true;
								}
							}
						}
						return false;
					}).call()) {
						continue; // not a valid spot
					}

					return ({x: x, y: y});
				}
			}

			return false;
		};

		/* Container.MoveTo(item)
		 *	Takes any item and moves it into given buffer.
		 */
		this.MoveTo = function (item) {
			var nPos, nDelay, cItem, cube;

			try {
				//Can we even fit it in here?
				nPos = this.FindSpot(item);

				if (!nPos) { // failed to find a spot
					return false;
				}

				//Cube -> Stash, place in inventory first, if failed
				if (item.location === sdk.storage.Cube && this.location === sdk.storage.Stash && !Storage.Inventory.MoveTo(item)) {
					return false;
				}

				//Can't deal with items on ground!
				if (item.mode === 3) { //ToDo; just simply pick it up
					return false;
				}

				//Make sure stash is open
				if (this.location === 7 && !Town.openStash()) {
					return false;
				}

				//Pick to cursor if not already.
				if (!(me.itemoncursor && item.mode !== 4)) {
					if (!item.toCursor()) {
						return false;
					}
				}

				//Loop three times to try and place it.
				for (let n = 0; n < 5; n += 1) {
					if (this.location === sdk.locations.Cube) { // place item into cube
						cItem = getUnit(100);
						cube = me.getItem(549);

						if (cItem !== null && cube !== null) {
							sendPacket(1, 0x2a, 4, cItem.gid, 4, cube.gid);
						}
					} else { //ToDo Can be just clickItem? clickItem(0,item);
						clickItem(0, nPos.y, nPos.x, this.location);
					}

					nDelay = getTickCount();

					while ((getTickCount() - nDelay) < Math.max(1000, me.ping * 3 + 500)) {
						if (!me.itemoncursor) {
							print("Successfully placed " + item.name + " at X: " + nPos.x + " Y: " + nPos.y);
							delay(200);

							return true;
						}

						delay(10);
					}
				}

				return true;
			} catch (e) {
				return false;
			}
		};

		/* Container.UsedSpacePercent()
		 *	Returns percentage of the container used.
		 */
		this.UsedSpacePercent = function () {
			let usedSpace = 0,
				totalSpace = this.height * this.width;

			Storage.Reload();

			for (let x = 0; x < this.height; x += 1) {
				for (let y = 0; y < this.width; y += 1) {
					if (this.buffer[x][y] > 0) {
						usedSpace += 1;
					}
				}
			}

			return usedSpace * 100 / totalSpace;
		};

		/* Container.compare(reference)
		 *	Compare given container versus the current one, return all new items in current buffer.
		 */
		this.Compare = function (baseRef) {
			var item, itemList, reference;

			Storage.Reload();

			try {
				itemList = [];
				reference = baseRef.slice(0, baseRef.length);

				//Insure valid reference.
				if (typeof (reference) !== "object" || reference.length !== this.buffer.length || reference[0].length !== this.buffer[0].length) {
					throw new Error("Unable to compare different containers.");
				}

				for (let h = 0; h < this.height; h += 1) {
					Loop:
						for (let w = 0; w < this.width; w += 1) {
							item = this.itemList[this.buffer[h][w] - 1];

							if (!item) {
								continue;
							}

							for (let n = 0; n < itemList.length; n += 1) {
								if (itemList[n].gid === item.gid) {
									continue Loop;
								}
							}

							//Check if the buffers changed and the current buffer has an item there.
							if (this.buffer[h][w] > 0 && reference[h][w] > 0) {
								itemList.push(copyUnit(item));
							}
						}
				}

				return itemList;
			} catch (e) {
				return false;
			}
		};

	};
	// Empty function;
	const Storage = {};

	/**@return integer */
	Storage.BeltSize = function () {
		let item = me.getItem(-1, 1); // get equipped item

		if (!item) { // nothing equipped
			return 1;
		}

		do {
			if (item.bodylocation === 8) { // belt slot
				switch (item.code) {
					case "lbl": // sash
					case "vbl": // light belt
						return 2;
					case "mbl": // belt
					case "tbl": // heavy belt
						return 3;
					default: // everything else
						return 4;
				}
			}
		} while (item.getNext());

		return 1; // no belt
	};

	/**@return {void} */
	Storage.Reload = function () {
		Containers.forEach(x => x.Reset());

		let items = me.getItems();

		items.forEach(item => Containers.find(container => container.location).Mark(item));
	};

	Storage.StashY = me.gametype === 0 ? 4 : 8;
	Storage.Inventory = new Container("Inventory", 10, 4, 3);
	Storage.TradeScreen = new Container("Inventory", 10, 4, 5);
	Storage.Stash = new Container("Stash", 6, Storage.StashY, 7);
	Storage.Belt = new Container("Belt", 4 * Storage.BeltSize(), 1, 2);
	Storage.Cube = new Container("Horadric Cube", 3, 4, 6);

	Storage.Reload();
	module.exports = Storage;

})(module, require);