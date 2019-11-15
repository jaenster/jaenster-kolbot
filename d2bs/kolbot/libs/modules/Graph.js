/**
 * @author ryancrunchi
 * @description Graph algorithms implementation for rooms exploration.
 */

(function (module, require) {

	let GraphDebug = {
		hooks: [],

		drawRoom: function (room) {
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
		this.vertices.sort((a, b) => getDistance(me.x, me.y, a.centerX, a.centerY) - getDistance(me.x, me.y, b.centerX, b.centerY));

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
				.sort((a, b) => getDistance(me.x, me.y, a.centerX, a.centerY) - getDistance(me.x, me.y, b.centerX, b.centerY));
		};
	};

	// DFS implementation
	// exploreFunction is a function called for every explored vertex in the graph that takes a vertex as parameter
	Graph.depthFirstSearch = function(graph, exploreFunction) {
		for (var i = 0; i < graph.vertices.length; i++) {
			if (!graph.vertices[i].seen) {
				Graph.explore(graph, graph.vertices[i], exploreFunction);
			}
		}
	};

	// Recursive exploration for DFS
	Graph.explore = function(graph, vertex, exploreFunction) {
		exploreFunction(vertex);
		vertex.seen = true;
		GraphDebug.removeHookForRoom(vertex);
		var neighbors = graph.nearbyVertices(vertex).filter(v => !v.seen);
		for (var i = 0; i < neighbors.length; i++) {
			Graph.explore(graph, neighbors[i], exploreFunction);
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