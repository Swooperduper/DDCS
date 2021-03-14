/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processSelfKill(eventObj: any): Promise<void> {
    // "self_kill", playerID
    const iPlayer = _.find(ddcsControllers.rtPlayerArray, {id: eventObj.data.arg1});

    if (iPlayer) {
        const iCurObj = {
            iPlayerId: eventObj.data.arg1,
            sessionName: ddcsControllers.getSessionName(),
            eventCode: ddcsControllers.shortNames[eventObj.action],
            iucid: iPlayer.ucid,
            iName: iPlayer.name,
            displaySide: "A",
            roleCode: "I",
            msg: "A: " + ddcsControllers.side[iPlayer.side] + " " + iPlayer.name + " has killed himself"
        };
        /*
        if (iCurObj.iucid) {
            await ddcsControllers.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
            await ddcsControllers.simpleStatEventActionsSave(iCurObj);
        }
         */
    }
}
