/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as backendEvent from "../backend";
import * as localDb from "../../db/local";
import * as webPush from "../../socketIO";

export async function processSelfKill(sessionName: string, eventObj: any): Promise<void> {
    // "self_kill", playerID
    const iPlayer = _.find(backendEvent.rtPlayerArray, {id: eventObj.data.arg1});

    if (iPlayer) {
        const iCurObj = {
            iPlayerId: eventObj.data.arg1,
            sessionName,
            eventCode: constants.shortNames[eventObj.action],
            iucid: iPlayer.ucid,
            iName: iPlayer.name,
            displaySide: "A",
            roleCode: "I",
            msg: "A: " + constants.side[iPlayer.side] + " " + iPlayer.name + " has killed himself"
        };
        if (iCurObj.iucid) {
            await webPush.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
            await localDb.simpleStatEventActionsSave(iCurObj);
        }
    }
}
