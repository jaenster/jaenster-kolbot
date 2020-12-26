var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastestPath = void 0;
    //@ts-ignore
    if (typeof rand === 'undefined')
        var rand = function (min, max) { return Math.random() * (max - min) + min; };
    var hypot = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var y = 0, i = args.length, containsInfinity = false, arg;
        while (i--) {
            arg = args[i];
            containsInfinity = containsInfinity || arg === Infinity || arg === -Infinity;
            y += arg * arg;
        }
        return containsInfinity ? Infinity : Math.sqrt(y);
    };
    var FastestPath = /** @class */ (function () {
        function FastestPath(nodes) {
            this.nodes = new Result(FastestPath.distance);
            this.nodes.replaceWith(nodes);
            this.result = new Result(FastestPath.distance);
            this.result.replaceWith(this.nodes);
        }
        FastestPath.distance = function (cur, index, self) {
            return hypot(self[index - 1].x - cur.x, self[index - 1].y - cur.y);
        };
        FastestPath.prototype.step = function () {
            var x = rand(1, this.nodes.length) - 1, y = rand(1, this.nodes.length) - 1;
            if (x === y)
                return;
            var tmp = this.nodes[x];
            this.nodes[x] = this.nodes[y];
            this.nodes[y] = tmp;
            this.nodes.calcDistance();
            // if this layout is better as old layout`
            if (this.nodes.distance < this.result.distance) {
                this.result.replaceWith(this.nodes);
            }
        };
        FastestPath.prototype.generate = function () {
            // make a copy of best
            var start = (new Date).getTime();
            do {
                this.step();
            } while ((new Date).getTime() - start < 1000);
            return this.result;
        };
        return FastestPath;
    }());
    exports.FastestPath = FastestPath;
    var Result = /** @class */ (function (_super) {
        __extends(Result, _super);
        function Result(getDistance) {
            var _this = _super.call(this, 0) || this;
            _this.cachedDistance = 0;
            _this.getDistance = getDistance;
            return _this;
        }
        Result.prototype.replaceWith = function (arr) {
            var _this = this;
            this.splice(0, this.length);
            arr.forEach(function (el) { return _this.push(el); });
            this.calcDistance();
        };
        Object.defineProperty(Result.prototype, "distance", {
            get: function () {
                return this.cachedDistance;
            },
            enumerable: false,
            configurable: true
        });
        Result.prototype.calcDistance = function () {
            var _this = this;
            return this.cachedDistance = this
                .map(function (cur, index, self) { return !index ? 0 : _this.getDistance(cur, index, self); })
                .reduce(function (acc, cur) { return acc + (cur || 0); }, 0);
        };
        return Result;
    }(Array));
});
//# sourceMappingURL=FastestPath.js.map