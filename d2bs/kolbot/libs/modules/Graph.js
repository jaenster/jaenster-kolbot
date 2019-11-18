/**
 * @author ryancrunchi
 * @description Graph algorithms implementation for rooms exploration.
 */

(function (module, require) {

	const Pather = require('Pather');

	let GraphDebug = {
		hooks: [],

		drawRoom: function (room) {
			if (this.hooks.findIndex(h => h.room.x == room.x && h.room.y == room.y) >= 0) {
				return;
			}
			var lines = [
				new Line(room.x*5, room.y*5, room.x*5+room.xsize, room.y*5, 0x84, true),
				new Line(room.x*5+room.xsize, room.y*5, room.x*5+room.xsize, room.y*5+room.ysize, 0x84, true),
				new Line(room.x*5+room.xsize, room.y*5+room.ysize, room.x*5, room.y*5+room.ysize, 0x84, true),
				new Line(room.x*5, room.y*5+room.ysize, room.x*5, room.y*5, 0x84, true),
			];
			this.hooks.push({room: room, lines: lines});
		},

		removeHookForRoom: function (room) {
			let index = this.hooks.findIndex(h => h.room.x == room.x && h.room.y == room.y);
			if (index != -1) {
				this.hooks[index].lines.forEach(l => l.remove());
				this.hooks.splice(index, 1);
			}
		},

		removeHooks: function () {
			this.hooks.forEach(hook => hook.line.remove());
			this.hooks = [];
		},
	};
	
	// Wrapper class for room as vertex
	function Vertex(room) {
		this.centerX = room.x*5 + room.xsize/2;
		this.centerY = room.y*5 + room.ysize/2;
		this.x = room.x;
		this.y = room.y;
		this.xsize = room.xsize;
		this.ysize = room.ysize;
		this.seen = false;
		this.walkableX = this.centerX;
		this.walkableY = this.centerY;
		this.area = room.level;
		let adjusted = Pather.getNearestWalkable(this.centerX, this.centerY, 20, 10);
		if (adjusted) {
			this.walkableX = adjusted[0];
			this.walkableY = adjusted[1];
		}

		this.walkablePath = function() {
			return getPath(this.area, me.x, me.y, this.walkableX, this.walkableY, 0, Pather.walkDistance);
		};

		this.walkablePathDistance = function() {
			return this.walkablePath().reduce((acc, v, i, arr) => {
				let prev = i ? arr[i-1] : v;
				return acc + Math.sqrt((prev.x-v.x)*(prev.x-v.x) + (prev.y-v.y)*(prev.y-v.y));
			}, 0);
		};

		this.walkablePathTo = function(other) {
			return getPath(this.area, this.walkableX, this.walkableY, other.walkableX, other.walkableY, 0, Pather.walkDistance);
		};

		this.walkablePathDistanceTo = function(other) {
			return this.walkablePathTo(other).reduce((acc, v, i, arr) => {
				let prev = i ? arr[i-1] : v;
				return acc + Math.sqrt((prev.x-v.x)*(prev.x-v.x) + (prev.y-v.y)*(prev.y-v.y));
			}, 0);
		};
	};


	// Class to handle graph search algorithms
	function Graph() {
		this.vertices = [];
		var room = getRoom();
		GraphDebug.removeHooks();
		if (room) {
			do {
				let vertex = new Vertex(room);
				this.vertices.push(vertex);
				GraphDebug.drawRoom(vertex);
			} while(room.getNext());
		}
		this.vertices.sort((a, b) => a.distance - b.distance);

		// get the graph vertex from room object
		this.vertexForRoom = function (room) {
			return this.vertices.find(v => v.x == room.x && v.y == room.y);
		};

		// get the room the vertex is in
		this.roomForVertex = function (vertex) {
			return getRoom(vertex.centerX, vertex.centerY);
		};

		// get nearby vertices from vertex (child) by getting neaby rooms.
		this.nearbyVertices = function (vertex) {
			var room = this.roomForVertex(vertex);
			if (!room) {
				return [];
			}
			return room.getNearby()
				.compactMap(r => this.vertexForRoom(r))
				//.sort((a, b) => a.adjustedPathDistance - b.adjustedPathDistance);
		};
	};

	Graph.customSearch = function(graph, explore) {
		while (graph.vertices.length) {
			var currentVertex = graph.vertices.shift();
			GraphDebug.drawRoom(currentVertex);
			while (currentVertex) {
				explore(currentVertex);
				currentVertex.seen = true;
				GraphDebug.removeHookForRoom(currentVertex);
				var neighbors = graph.nearbyVertices(currentVertex)
					.filter(v => !v.seen)
					.sort((a, b) => currentVertex.walkablePathDistanceTo(a) - currentVertex.walkablePathDistanceTo(b));
				neighbors.forEach(x => GraphDebug.drawRoom(x));
				currentVertex = neighbors.first();
			}
			graph.vertices.filter(v => !v.seen).sort((a, b) => a.walkablePathDistance() - b.walkablePathDistance());
		}
	};

	// DFS implementation
	// exploreFunction is a function called for every explored vertex in the graph that takes a vertex as parameter
	Graph.depthFirstSearch = function(graph, exploreFunction) {
		var stack = [];
		var startVertex = graph.vertices.first();
		stack.push(startVertex);
		while (stack.length) {
			let vertex = stack.pop();
			if (!vertex.seen) {
				exploreFunction(vertex);
				vertex.seen = true;
				GraphDebug.removeHookForRoom(vertex);
				var neighbors = graph.nearbyVertices(vertex).filter(v => !v.seen);
				for (var i = 0; i < neighbors.length; i++) {
					stack.push(neighbors[i]);
				}
				stack.sort((a, b) => b.walkablePathDistance()-a.walkablePathDistance());
			}
		}
	};

	// BFS implementation
	// exploreFunction is a function called for every explored vertex in the graph that takes a vertex as parameter
	Graph.breadthFirstSearch = function(graph, exploreFunction) {
		var queue = [];
		var startVertex = graph.vertices.first();
		queue.push(startVertex);
		while (queue.length) {
			let vertex = queue.shift();
			var neighbors = graph.nearbyVertices(vertex).filter(v => !v.seen);
			for (var i = 0; i < neighbors.length; i++) {
				queue.push(neighbors[i]);
				neighbors[i].seen = true;
			}
			exploreFunction(vertex);
			vertex.seen = true;
			GraphDebug.removeHookForRoom(vertex);
		}
	};

	module.exports = Graph;

})(module, require);