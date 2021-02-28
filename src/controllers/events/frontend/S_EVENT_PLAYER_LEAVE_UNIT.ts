/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventPlayerLeaveUnit(eventObj: any): Promise<void> {
    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.initiator.unitId});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    if (iUnit[0]) {

        await ddcsControllers.processUnitUpdates({action: "D", data: {name: iUnit[0].name}});

        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            const iCurObj = {
                sessionName: ddcsControllers.getSessionName(),
                eventCode: ddcsControllers.shortNames[eventObj.action],
                iucid: iPlayer.ucid,
                iName: iUnit[0].playername,
                displaySide: iUnit[0].coalition,
                roleCode: "I",
                msg: "C: " + iUnit[0].playername + " leaves his " + iUnit[0].type
            };
            if (iCurObj.iucid) {
                await ddcsControllers.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                await ddcsControllers.simpleStatEventActionsSave(iCurObj);
            }
            console.log("PLAYER EXIT UNIT: ", iUnit[0].playername);
        }
    }
}
