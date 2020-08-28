/**
 * @description Read CSV files
 * @author ryancrunchi
 */

(function (module, require) {

	const Promise = require('Promise');
	
	const CSVReader = function (url, delimiter = "\t") {
		this.url = url;
		this.values = [];
		this.headers = [];

		this.valueAtName = (colName, row) => {
			if (row < 0 || row >= this.values.length) {
				return undefined;
			}
			let colIndex = this.headers.indexOf(colName);
			return this.values[row][colIndex];
		};

		this.valueAt = (col, row) => {
			if (typeof col === "string") {
				return this.valueAtName(col, row);
			}
			if (row < 0 || row >= this.values.length) {
				return undefined;
			}
			return this.values[row][col];
		};

		this.findObject = (col, value) => {
			let row = this.values.find(r => {
				if (r.find(v => v == value)) {
					return r;
				}
				return undefined;
			});
			if (!row) {
				return undefined;
			}
			return this.objectFromRow(row);
		};

		this.objectFromRow = (row) => {
			var object = {};
			row.forEach((v, i) => {
				object[this.headers[i]] = v;
			})
			return object;
		};

		try {
			if (!FileTools.exists(this.url)) {
				throw new Error("File "+this.url+" does not exist");
			}
			let text = FileTools.readText(this.url);
			let rows = text.split(/\r?\n/);
			if (rows.length) {
				this.headers = rows.shift().split(delimiter);
				this.values = rows.map(r => r.split(delimiter));
			}
			else {
				print(sdk.colors.Orange+"No rows in file "+this.url);
			}
		}
		catch (e) {
			print(sdk.colors.Red+e);
		}
	};

	module.exports = CSVReader;

}).call(null, module, require);

