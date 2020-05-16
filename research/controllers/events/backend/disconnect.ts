/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../../";
import * as backendEvent from "../backend";
import * as localDb from "../../db/local";
import * as playerLib from "../../player";
import * as webPush from "../../socketIO";

export async function processDisconnect(sessionName: string, eventObj: any): Promise<void> {
    // "disconnect", playerID, name, playerSide, reason_code
    const iPlayer = _.find(backendEvent.rtPlayerArray, {id: eventObj.data.arg1});

    if (iPlayer) {
        const iCurObj = {
            sessionName,
            eventCode: constants.shortNames[eventObj.action],
            iucid: iPlayer.ucid,
            iName: iPlayer.name,
            displaySide: "A",
            roleCode: "I",
            msg: "A: " + iPlayer.name + " has disconnected - Ping:" + iPlayer.ping + " Lang:" + iPlayer.lang
        };
        if (iCurObj.iucid) {
            await webPush.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
            await localDb.simpleStatEventActionsSave(iCurObj);
        }
        await playerLib.sendMesgToCoalition(
            eventObj.data.arg3,
            iCurObj.msg,
            5
        );
    }
}
