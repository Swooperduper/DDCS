/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processEventPlayerLeaveUnit(sessionName: string, eventObj: any): Promise<void> {
    const iUnit = await ddcsController.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await ddcsController.srvPlayerActionsRead({sessionName});
    if (iUnit[0]) {

        await ddcsController.processUnitUpdates(sessionName, {action: "D", data: {name: iUnit[0].name}});

        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: ddcsController.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: iUnit[0].coalition,
                roleCode: "I",
                msg: "C: " + iUnit[0].playername + " leaves his " + iUnit[0].type
            };
            if (iCurObj.iucid) {
                await ddcsController.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsController.simpleStatEventActionsSave(iCurObj);
            }
        }
    }
}
