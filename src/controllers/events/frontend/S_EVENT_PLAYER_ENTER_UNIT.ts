/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processEventPlayerEnterUnit(sessionName: string, eventObj: any): Promise<void> {
    const iUnit = await ddcsController.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await ddcsController.srvPlayerActionsRead({sessionName});
    const curIUnit = iUnit[0];
    if (curIUnit) {

        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName,
                eventCode: ddcsController.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: curIUnit.playername,
                displaySide: curIUnit.coalition,
                roleCode: "I",
                msg: "C: " + curIUnit.playername + " enters a brand new " + curIUnit.type
            };
            if (iCurObj.iucid) {
                await ddcsController.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsController.simpleStatEventActionsSave(iCurObj);
            }
        }
    }
}
