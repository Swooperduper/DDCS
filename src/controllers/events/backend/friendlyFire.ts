/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export async function processFriendlyFire(eventObj: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    // var iCurObj;
    let iPlayer: any;
    let tPlayer: any;
    let curIUnit;
    let curTUnit;
    let mesg;
    iPlayer = _.find(ddcsControllers.rtPlayerArray, {id: eventObj.data.arg1});
    tPlayer = _.find(ddcsControllers.rtPlayerArray, {id: eventObj.data.arg3});

    if (iPlayer && tPlayer) {
        if (iPlayer.slot !== tPlayer.slot && iPlayer.ucid !== tPlayer.ucid) {
            const iPlayers = await ddcsControllers.srvPlayerActionsRead({_id: iPlayer.ucid});
            const curIPlayer = iPlayers[0];
            const tPlayers = await ddcsControllers.srvPlayerActionsRead({_id: tPlayer.ucid});
            const curTPlayer = tPlayers[0];
            if (curIPlayer.safeLifeActionTime || 0 < new Date().getTime()) {
                const iunit = await ddcsControllers.unitActionRead({unitId: iPlayer.slot});
                const tunit = await ddcsControllers.unitActionRead({unitId: tPlayer.slot});
                curIUnit = iunit[0];
                curTUnit = tunit[0];
                if (engineCache.config.lifePointsEnabled) {
                    await ddcsControllers.removeLifePoints(
                        curIPlayer,
                        curIUnit,
                        "Friendly Kill",
                        true,
                        6
                    );
                }

                if (curTUnit.inAir && engineCache.config.lifePointsEnabled) {
                    await ddcsControllers.addLifePoints(
                        curTPlayer,
                        curTUnit
                    );
                }

                mesg = "A: " + ddcsControllers.side[iPlayer.side] + " " + iPlayer.name + "(" + curIUnit.type +
                    ":-6 LP) has hit friendly " + tPlayer.name + "(" + curTUnit.type + ":+LPLoss) with a " +
                    eventObj.data.arg2 || "?";
                await ddcsControllers.sendMesgToCoalition(
                    iPlayer.side,
                    mesg,
                    15
                );
            }
        }
    }
}
