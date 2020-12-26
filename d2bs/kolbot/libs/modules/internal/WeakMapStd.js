/**
 * @description Just a weakmap with a default value as standard
 * @author Jaenster
 */
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
    exports.MapStd = exports.WeakMapStd = void 0;
    var WeakMapStd = /** @class */ (function (_super) {
        __extends(WeakMapStd, _super);
        function WeakMapStd(factory) {
            var _this = _super.call(this) || this;
            _this.factory = factory;
            return _this;
        }
        WeakMapStd.prototype.get = function (key) {
            var returnData = _super.prototype.get.call(this, key);
            if (returnData === undefined)
                _super.prototype.set.call(this, key, returnData = this.factory());
            return returnData;
        };
        return WeakMapStd;
    }(WeakMap));
    exports.WeakMapStd = WeakMapStd;
    var MapStd = /** @class */ (function (_super) {
        __extends(MapStd, _super);
        function MapStd(factory) {
            var _this = _super.call(this) || this;
            _this.factory = factory;
            return _this;
        }
        MapStd.prototype.get = function (key) {
            var returnData = _super.prototype.get.call(this, key);
            if (returnData === undefined)
                _super.prototype.set.call(this, key, returnData = this.factory());
            return returnData;
        };
        return MapStd;
    }(Map));
    exports.MapStd = MapStd;
});
//# sourceMappingURL=WeakMapStd.js.map