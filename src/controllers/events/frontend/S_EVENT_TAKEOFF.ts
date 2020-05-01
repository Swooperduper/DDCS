/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processEventTakeoff(sessionName: string, eventObj: any): Promise<void> {
    let place: string;
    if (eventObj.data.arg6) {
        place = " from " + eventObj.data.arg6;
    } else if (eventObj.data.arg5) {
        place = " from " + eventObj.data.arg5;
    } else {
        place = "";
    }

    const iUnit = await ddcsController.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await ddcsController.srvPlayerActionsRead({sessionName});
    const curIUnit = iUnit[0];
    const curUnitSide = curIUnit.coalition;
    if (_.isUndefined(curIUnit)) {
        console.log("isUndef: ", eventObj);
    }
    if (curIUnit) {
        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        if (iPlayer && iPlayer.ucid) {
            if (await ddcsController.checkWeaponComplianceOnTakeoff(iPlayer, curIUnit)) {
                const friendlyBases = await ddcsController.getBasesInProximity(curIUnit.lonLatLoc, 5, curUnitSide);
                if (friendlyBases.length > 0) {
                    const iCurObj = {
                        sessionName,
                        eventCode: ddcsController.shortNames[eventObj.action],
                        iucid: iPlayer.ucid,
                        iName: curIUnit.playername,
                        displaySide: curIUnit.coalition,
                        roleCode: "I",
                        msg: "C: " + curIUnit.type + "(" + curIUnit.playername + ") has taken off" + place
                    };
                    if (ddcsController.config.lifePointsEnabled) {
                        await ddcsController.removeLifePoints(
                            iPlayer,
                            curIUnit,
                            "Takeoff"
                        );
                    }
                    await ddcsController.sendToCoalition({payload: {
                            action: eventObj.action,
                            data: _.cloneDeep(iCurObj)
                        }});
                    await ddcsController.simpleStatEventActionsSave(iCurObj);
                }
            }
        }
    }
}
