/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventBirth(eventObj: any): Promise<void> {
    const curUnitId = eventObj.data.initiator.unitId;
    console.log(eventObj);
    if (curUnitId) {
        const iUnit = await ddcsControllers.unitActionRead({unitId: curUnitId});
        const curIUnit = iUnit[0];
        if (curIUnit && curIUnit.playername && curIUnit.playername !== "") {
            const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
            console.log("PA: ", playerArray);
            if (curIUnit) {
                const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                console.log("playerarray: ", iPlayer, curIUnit);
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
                    console.log(iCurObj.msg)
                    /*
                    if (iCurObj.iucid) {
                        await ddcsControllers.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                        // await ddcsControllers.simpleStatEventActionsSave(iCurObj);
                    }
                     */
                    await ddcsControllers.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId});
                }
            }
        }

        /*
        // give them a menu
        if (eventObj.data.initiator.groupId) {
            // Only players can get a menu
            // console.log("spawning player menu");
            await ddcsControllers.initializeMenu(eventObj.data.initiator);
        }
         */
    }
}
