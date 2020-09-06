type Node = { x: number, y: number };

//@ts-ignore
if (typeof rand === 'undefined') var rand = (min, max) => Math.random() * (max - min) + min;

const hypot = function (...args: number[]) {
    let y = 0, i = args.length, containsInfinity = false, arg;
    while (i--) {
        arg = args[i];
        containsInfinity = containsInfinity || arg === Infinity || arg === -Infinity;
        y += arg * arg;
    }
    return containsInfinity ? Infinity : Math.sqrt(y)
};

export class FastestPath {
    private readonly nodes: Result<Node>;
    public readonly result: Result<Node>;

    constructor(nodes: Node[]) {
        this.nodes = new Result(FastestPath.distance);
        this.nodes.replaceWith(nodes);

        this.result = new Result(FastestPath.distance);
        this.result.replaceWith(this.nodes);
    }

    private static distance(cur: Node, index: number, self: Node[]) {
        return hypot(self[index - 1].x - cur.x, self[index - 1].y - cur.y);
    }


    private step() {
        let x = rand(1, this.nodes.length) - 1,
            y = rand(1, this.nodes.length) - 1;

        if (x === y) return;


        const tmp = this.nodes[x];
        this.nodes[x] = this.nodes[y];
        this.nodes[y] = tmp;

        this.nodes.calcDistance();

        // if this layout is better as old layout`
        if (this.nodes.distance < this.result.distance) {
            this.result.replaceWith(this.nodes);
        }
    }

    generate(): Node[] {
        // make a copy of best

        const start = (new Date).getTime();

        do {
            this.step();
        } while((new Date).getTime()-start < 1000);

        return this.result as Node[];
    }
}

class Result<T> extends Array<T> {
    private getDistance: (cur: T, index: number, self: T[]) => number;
    private cachedDistance: number = 0;

    constructor(getDistance: (cur: T, index: number, self: T[]) => number) {
        super(0); // array of 0
        this.getDistance = getDistance;
    }

    replaceWith(arr: T[]) {
        this.splice(0, this.length);
        arr.forEach(el => this.push(el));
        this.calcDistance();
    }

    get distance() {
        return this.cachedDistance;
    }

    calcDistance() {
        return this.cachedDistance = this
            .map((cur, index, self) => !index ? 0 : this.getDistance(cur, index, self))
            .reduce((acc, cur) => acc + (cur || 0), 0);
    }

}