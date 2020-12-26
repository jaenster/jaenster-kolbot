(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../modules/GameMode", "../modules/Config", "../modules/Loader"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var GameMode = require("../modules/GameMode");
    var Config = require("../modules/Config");
    var Loader = require("../modules/Loader");
    new GameMode({
        active: function () {
            var script = getScript();
            var found = false;
            do {
                console.log(script);
                found = found || script.name.indexOf('d2botautoplay') > -1;
            } while (script.getNext() && !found);
            return found;
        },
        name: 'AutoPlay',
        prio: 0,
        handler: function () {
            console.debug('Starting AutoPlay');
            Config('AutoPlay');
            me.automap = Config.AutoMap;
            load("tools/ToolsThread.js");
            try {
                Loader.runScript('AutoPlay');
            }
            finally {
                quit();
            }
        }
    });
});
//# sourceMappingURL=AutoPlay.js.map