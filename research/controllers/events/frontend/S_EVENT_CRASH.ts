/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../../";
import * as localDb from "../../db/local";
import * as playerLib from "../../player";
import * as serverToDbSync from "../../serverToDbSync";
import * as webPush from "../../socketIO";

export async function processEventCrash(sessionName: string, eventObj: any): Promise<void> {
    const nowTime = new Date().getTime();
    const iUnit = await localDb.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await localDb.srvPlayerActionsRead({sessionName});
    const curIUnit = iUnit[0];
    if (curIUnit) {

        await serverToDbSync.processUnitUpdates(sessionName, {action: "D", data: {name: curIUnit.name}});

        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: constants.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: curIUnit.playername,
                displaySide: "A",
                roleCode: "I",
                msg: "A: " + constants.side[curIUnit.coalition] + " " + curIUnit.type + "(" + curIUnit.playername + ") has crashed",
                groupId: curIUnit.groupId
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
