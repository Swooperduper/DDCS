/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../../";
import * as localDb from "../../db/local";
import * as serverToDbSync from "../../serverToDbSync";
import * as webPush from "../../socketIO";

export async function processEventPlayerLeaveUnit(sessionName: string, eventObj: any): Promise<void> {
    const iUnit = await localDb.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await localDb.srvPlayerActionsRead({sessionName});
    if (iUnit[0]) {

        await serverToDbSync.processUnitUpdates(sessionName, {action: "D", data: {name: iUnit[0].name}});

        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: constants.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: iUnit[0].coalition,
                roleCode: "I",
                msg: "C: " + iUnit[0].playername + " leaves his " + iUnit[0].type
            };
            if (iCurObj.iucid) {
                await webPush.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await localDb.simpleStatEventActionsSave(iCurObj);
            }
        }
    }
}
