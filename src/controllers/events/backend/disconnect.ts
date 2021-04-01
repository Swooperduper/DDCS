/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processDisconnect(eventObj: any): Promise<void> {
    // "disconnect", playerID, name, playerSide, reason_code
    const iPlayer = _.find(ddcsControllers.rtPlayerArray, {id: eventObj.data.arg1});

    if (iPlayer) {
        const iCurObj = {
            sessionName: ddcsControllers.getSessionName(),
            eventCode: ddcsControllers.shortNames[eventObj.action],
            iucid: iPlayer.ucid,
            iName: iPlayer.name,
            displaySide: "A",
            roleCode: "I",
            msg: "A: " + iPlayer.name + " has disconnected - Ping:" + iPlayer.ping + " Lang:" + iPlayer.lang
        };
        console.log(iCurObj.msg);
        /*
        if (iCurObj.iucid) {
            await ddcsControllers.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
            await ddcsControllers.simpleStatEventActionsSave(iCurObj);
        }

        await ddcsControllers.sendMesgToCoalition(
            eventObj.data.arg3,
            iCurObj.msg,
            5
        );
         */
    }
}
