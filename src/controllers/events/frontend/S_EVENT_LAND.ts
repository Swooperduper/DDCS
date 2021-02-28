/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processEventLand(eventObj: any): Promise<void> {
    console.log("LAND: ", eventObj);
    const engineCache = ddcsControllers.getEngineCache();
    let place: string = "";
    let baseLand: string = "";

    // Occurs when an aircraft lands at an airbase, farp or ship
    if (eventObj && eventObj.data && eventObj.data.initiator.place && eventObj.data.initiator.place) {
        baseLand = eventObj.data.initiator.place;
    } else {
        baseLand = "";
    }

    const iUnit = await ddcsControllers.unitActionRead({unitId: eventObj.data.initiator.unitId, isCrate: false});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});

    if (_.isUndefined(iUnit[0])) {
        console.log("isUndef: ", eventObj);
    }
    if (iUnit[0]) {
        const curUnitName = iUnit[0].name;
        if (_.includes(curUnitName, "LOGISTICS|")) {
            const bName = _.split(curUnitName, "|")[2];
            const curSide = iUnit[0].coalition;
            const bases = await ddcsControllers.baseActionRead({_id: bName});
            const curBase = bases[0]; // does this work?
            console.log("LANDINGCARGO: ", curBase.side === curSide, baseLand === bName, baseLand, " = ", bName,
                iUnit[0].unitCategory);
            if (curBase.side === curSide) {
                await ddcsControllers.replenishUnits( bName, curSide, false);
                await ddcsControllers.healBase( bName, iUnit[0], false);
            }
        }
        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        console.log("landing: ", iUnit[0].playername);
        if (iPlayer) {
            const curUnitSide = iUnit[0].coalition;
            const friendlyBases = await ddcsControllers.getBasesInProximity(iUnit[0].lonLatLoc, 5, curUnitSide);
            if (friendlyBases.length > 0) {
                const curBase = friendlyBases[0];
                place = " at " + curBase._id;
                await ddcsControllers.srvPlayerActionsApplyTempToRealScore({
                    _id: iPlayer._id,
                    groupId: iUnit[0].groupId
                });
                const iCurObj = {
                    sessionName: ddcsControllers.getSessionName(),
                    eventCode: ddcsControllers.shortNames[eventObj.action],
                    iucid: iPlayer.ucid,
                    iName: iUnit[0].playername,
                    displaySide: iUnit[0].coalition,
                    roleCode: "I",
                    msg: "C: " + iUnit[0].type + "(" + iUnit[0].playername + ") has landed at friendly " + place
                };
                console.log("FriendBaseLand: ", iCurObj.msg);
                if (engineCache.config.lifePointsEnabled && !_.includes(iPlayer.slot, "_")) {
                    console.log("checkSlotLanding: ", iPlayer.slot);
                    await ddcsControllers.addLifePoints(
                        iPlayer,
                        iUnit[0],
                        "Land"
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
