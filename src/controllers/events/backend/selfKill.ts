/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as playersEvent from "./players";
import * as webPushCommands from "../../socketIO/webPush";

export async function processSelfKill(sessionName: string, eventObj: any) {
    // "self_kill", playerID
    const iPlayer = _.find(playersEvent.rtPlayerArray, {id: eventObj.data.arg1});

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
            webPushCommands.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}})
                .catch((err) => {
                    console.log("err line30: ", err);
                });
            masterDBController.simpleStatEventActionsSave(iCurObj)
                .catch((err) => {
                    console.log("err line45: ", err);
                });
        }
        /*
        DCSLuaCommands.sendMesgToAll(
            serverName,
            _.get(iCurObj, 'msg'),
            15
        );
        */
    }
}
