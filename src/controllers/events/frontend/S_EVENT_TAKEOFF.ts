/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventTakeoff(eventObj: any): Promise<void> {
    // console.log("TAKEOFF: ", eventObj);
    const engineCache = ddcsControllers.getEngineCache();
    let place: string;
    if (eventObj && eventObj.data && eventObj.data.place) {
        place = eventObj.data.place;
    } else {
        place = "";
    }

    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.initiator.unitId});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    const curIUnit = iUnit[0];
    const curUnitSide = curIUnit.coalition;
    if (_.isUndefined(curIUnit)) {
        console.log("isUndef: ", eventObj);
    }
    // console.log("curIunit: ", curIUnit);
    if (curIUnit) {
        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
        // console.log("iPlayer: ", iPlayer);
        if (iPlayer && iPlayer.ucid) {
            if (await ddcsControllers.checkWeaponComplianceOnTakeoff(iPlayer, curIUnit)) {
                const friendlyBases = await ddcsControllers.getBasesInProximity(curIUnit.lonLatLoc, 5, curUnitSide);
                //console.log("getBASE: ", curIUnit, curUnitSide, friendlyBases);
                if (friendlyBases.length > 0) {
                    // console.log("LPE: ", engineCache.config.lifePointsEnabled, !_.includes(iPlayer.slot, "_"));
                    if (engineCache.config.lifePointsEnabled && !_.includes(iPlayer.slot, "_")) {
                        console.log("checkSlotTakeoff: ", iPlayer.slot);
                        await ddcsControllers.removeLifePoints(
                            iPlayer,
                            curIUnit,
                            "Takeoff"
                        );
                    }
                    /*
                    await ddcsControllers.sendToCoalition({payload: {
                            action: eventObj.action,
                            data: _.cloneDeep(iCurObj)
                        }});
                    await ddcsControllers.simpleStatEventActionsSave(iCurObj);
                    */
                }
            }
        }
    }
}
