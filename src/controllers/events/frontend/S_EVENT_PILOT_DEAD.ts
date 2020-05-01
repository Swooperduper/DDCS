/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processEventPilotDead(sessionName: string, eventObj: any): Promise<void> {
    const nowTime = new Date().getTime();
    const iUnit = await ddcsController.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await ddcsController.srvPlayerActionsRead({sessionName});
    if (iUnit[0]) {
        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: ddcsController.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: "A",
                roleCode: "I",
                msg: "A: " + ddcsController.side[iUnit[0].coalition] + " " + iUnit[0].type + "(" + iUnit[0].playername +
                    ") pilot is dead",
                groupId: iUnit[0].groupId
            };
            if (iCurObj.iucid) {
                await ddcsController.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsController.simpleStatEventActionsSave(iCurObj);
            }
            await ddcsController.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId});

            if (ddcsController.config.inGameHitMessages) {
                await ddcsController.sendMesgToAll(
                    iCurObj.msg,
                    5,
                    nowTime + ddcsController.time.oneMin
                );
            }
        }
    }
}
