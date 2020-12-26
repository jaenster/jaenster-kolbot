import * as HeartBeat from "./Heartbeat";

import {restarter} from "./Debug";

export = function OutOfGameHandler(callback: () => void) {

    while (!(HeartBeat.handle && Object.keys(HeartBeat.gameInfo).length)) delay(10);
    console.log('got heartbeat');
    include("OOG.js");

    //@ts-ignore
    if (!FileTools.exists("data/" + me.profile + ".json")) DataFile.create();

    restarter(82); // Press R to restart the script

    callback();

    while(true) {
        delay(100);
    }
}