/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processEventLand(sessionName: string, eventObj: any): Promise<void> {
    let place: string = "";
    let baseLand: string = "";

    // Occurs when an aircraft lands at an airbase, farp or ship
    if (eventObj.data.arg6) {
        baseLand = eventObj.data.arg6;
    } else if (eventObj.data.arg5) {
        baseLand = eventObj.data.arg5;
    }

    const iUnit = await ddcsController.unitActionRead({unitId: eventObj.data.arg3, isCrate: false});
    const playerArray = await ddcsController.srvPlayerActionsRead({sessionName});

    if (_.isUndefined(iUnit[0])) {
        console.log("isUndef: ", eventObj);
    }
    if (iUnit[0]) {
        const curUnitName = iUnit[0].name;
        if (_.includes(curUnitName, "LOGISTICS|")) {
            const bName = _.split(curUnitName, "|")[2];
            const curSide = iUnit[0].coalition;
            const bases = await ddcsController.baseActionRead({_id: bName});
            const curBase = bases[0]; // does this work?
            console.log("LANDINGCARGO: ", curBase.side === curSide, baseLand === bName, baseLand, " = ", bName,
                iUnit[0].category);
            if (curBase.side === curSide) {
                await ddcsController.replenishUnits( bName, curSide);
                await ddcsController.healBase( bName, iUnit[0]);
            }
        }
        const iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        console.log("landing: ", iUnit[0].playername);
        if (iPlayer) {
            const curUnitSide = iUnit[0].coalition;
            const friendlyBases = await ddcsController.getBasesInProximity(iUnit[0].lonLatLoc, 5, curUnitSide);
            if (friendlyBases.length > 0) {
                const curBase = friendlyBases[0];
                place = " at " + curBase._id;
                await ddcsController.srvPlayerActionsApplyTempToRealScore({
                    _id: iPlayer._id,
                    groupId: iUnit[0].groupId
                });
                const iCurObj = {
                    sessionName,
                    eventCode: ddcsController.shortNames[eventObj.action],
                    iucid: iPlayer.ucid,
                    iName: iUnit[0].playername,
                    displaySide: iUnit[0].coalition,
                    roleCode: "I",
                    msg: "C: " + iUnit[0].type + "(" + iUnit[0].playername + ") has landed at friendly " + place
                };
                console.log("FriendBaseLand: ", iCurObj.msg);
                if (iCurObj.iucid && ddcsController.config.lifePointsEnabled) {
                    await ddcsController.addLifePoints(
                        iPlayer,
                        iUnit[0],
                        "Land"
                    );
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
