/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventTakeoff(eventObj: any): Promise<void> {
    let place: string;
    if (eventObj.data.arg6) {
        place = " from " + eventObj.data.arg6;
    } else if (eventObj.data.arg5) {
        place = " from " + eventObj.data.arg5;
    } else {
        place = "";
    }

    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.arg3});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.sessionName});
    const curIUnit = iUnit[0];
    const curUnitSide = curIUnit.coalition;
    if (_.isUndefined(curIUnit)) {
        console.log("isUndef: ", eventObj);
    }
    if (curIUnit) {
        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        if (iPlayer && iPlayer.ucid) {
            if (await ddcsControllers.checkWeaponComplianceOnTakeoff(iPlayer, curIUnit)) {
                const friendlyBases = await ddcsControllers.getBasesInProximity(curIUnit.lonLatLoc, 5, curUnitSide);
                if (friendlyBases.length > 0) {
                    const iCurObj = {
                        sessionName: ddcsControllers.sessionName,
                        eventCode: ddcsControllers.shortNames[eventObj.action],
                        iucid: iPlayer.ucid,
                        iName: curIUnit.playername,
                        displaySide: curIUnit.coalition,
                        roleCode: "I",
                        msg: "C: " + curIUnit.type + "(" + curIUnit.playername + ") has taken off" + place
                    };
                    if (ddcsControllers.config.lifePointsEnabled) {
                        await ddcsControllers.removeLifePoints(
                            iPlayer,
                            curIUnit,
                            "Takeoff"
                        );
                    }
                    await ddcsControllers.sendToCoalition({payload: {
                            action: eventObj.action,
                            data: _.cloneDeep(iCurObj)
                        }});
                    await ddcsControllers.simpleStatEventActionsSave(iCurObj);
                }
            }
        }
    }
}
