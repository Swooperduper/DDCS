/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processSelfKill(sessionName: string, eventObj: any): Promise<void> {
    // "self_kill", playerID
    const iPlayer = _.find(ddcsController.rtPlayerArray, {id: eventObj.data.arg1});

    if (iPlayer) {
        const iCurObj = {
            iPlayerId: eventObj.data.arg1,
            sessionName,
            eventCode: ddcsController.shortNames[eventObj.action],
            iucid: iPlayer.ucid,
            iName: iPlayer.name,
            displaySide: "A",
            roleCode: "I",
            msg: "A: " + ddcsController.side[iPlayer.side] + " " + iPlayer.name + " has killed himself"
        };
        if (iCurObj.iucid) {
            await ddcsController.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
            await ddcsController.simpleStatEventActionsSave(iCurObj);
        }
    }
}
