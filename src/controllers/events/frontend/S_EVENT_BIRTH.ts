/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventBirth(eventObj: any): Promise<void> {
    const curUnitId = eventObj.data.arg3;
    if (curUnitId) {
        const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.arg3});
        const curIUnit = iUnit[0];
        if (curIUnit.playername !== "") {
            const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
            if (curIUnit) {
                const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                if (iPlayer) {
                    const iCurObj = {
                        sessionName: ddcsControllers.getSessionName(),
                        eventCode: ddcsControllers.shortNames[eventObj.action],
                        iucid: iPlayer.ucid,
                        iName: curIUnit.playername,
                        displaySide: curIUnit.coalition,
                        roleCode: "I",
                        msg: "C: " + curIUnit.playername + " enters a brand new " + curIUnit.type,
                        groupId: curIUnit.groupId
                    };
                    if (iCurObj.iucid) {
                        await ddcsControllers.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                        await ddcsControllers.simpleStatEventActionsSave(iCurObj);
                    }
                    await ddcsControllers.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId});
                }
            }
        }
    }
}
