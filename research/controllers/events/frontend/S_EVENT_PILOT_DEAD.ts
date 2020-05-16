/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../../";
import * as localDb from "../../db/local";
import * as playerLib from "../../player";
import * as webPush from "../../socketIO";

export async function processEventPilotDead(sessionName: string, eventObj: any): Promise<void> {
    const nowTime = new Date().getTime();
    const iUnit = await localDb.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await localDb.srvPlayerActionsRead({sessionName});
    if (iUnit[0]) {
        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: constants.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: "A",
                roleCode: "I",
                msg: "A: " + constants.side[iUnit[0].coalition] + " " + iUnit[0].type + "(" + iUnit[0].playername +
                    ") pilot is dead",
                groupId: iUnit[0].groupId
            };
            if (iCurObj.iucid) {
                await webPush.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await localDb.simpleStatEventActionsSave(iCurObj);
            }
            await localDb.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId});

            if (constants.config.inGameHitMessages) {
                await playerLib.sendMesgToAll(
                    iCurObj.msg,
                    5,
                    nowTime + constants.time.oneMin
                );
            }
        }
    }
}
