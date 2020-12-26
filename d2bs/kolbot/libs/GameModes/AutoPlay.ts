import * as GameMode from '../modules/GameMode';
import * as Config from "../modules/Config";
import * as Loader from "../modules/Loader";


new GameMode({
    active: () => {
        const script = getScript() as Script;
        let found = false;
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
        } finally {
            quit();
        }

    }



})