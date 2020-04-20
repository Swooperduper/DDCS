/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as playersEvent from "../../events/backend/players";
import * as webPushCommands from "../../socketIO/webPush";

export async function processDisconnect(sessionName: string, eventObj: any) {
    // "disconnect", playerID, name, playerSide, reason_code
    const iPlayer = _.find(playersEvent.rtPlayerArray, {id: eventObj.data.arg1});

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
            webPushCommands.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}})
                .catch((err: any) => {
                    console.log("err line29: ", err);
                });
            masterDBController.simpleStatEventActionsSave(iCurObj)
                .catch((err: any) => {
                    console.log("err line45: ", err);
                });
        }
        DCSLuaCommands.sendMesgToCoalition(
            eventObj.data.arg3,
            iCurObj.msg,
            5
        )
            .catch((err: any) => {
                console.log("err line39: ", err);
            });
    }
}
