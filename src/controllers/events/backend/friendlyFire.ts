/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";

export async function processFriendlyFire(sessionName: string, eventObj: any): Promise<void> {
    // var iCurObj;
    let iPlayer: any;
    let tPlayer: any;
    let curIUnit;
    let curTUnit;
    let mesg;
    iPlayer = _.find(ddcsController.rtPlayerArray, {id: eventObj.data.arg1});
    tPlayer = _.find(ddcsController.rtPlayerArray, {id: eventObj.data.arg3});

    if (iPlayer && tPlayer) {
        if (iPlayer.slot !== tPlayer.slot && iPlayer.ucid !== tPlayer.ucid) {
            const iPlayers = await ddcsController.srvPlayerActionsRead({_id: iPlayer.ucid});
            const curIPlayer = iPlayers[0];
            const tPlayers = await ddcsController.srvPlayerActionsRead({_id: tPlayer.ucid});
            const curTPlayer = tPlayers[0];
            if (curIPlayer.safeLifeActionTime || 0 < new Date().getTime()) {
                const iunit = await ddcsController.unitActionRead({unitId: iPlayer.slot});
                const tunit = await ddcsController.unitActionRead({unitId: tPlayer.slot});
                curIUnit = iunit[0];
                curTUnit = tunit[0];
                if (ddcsController.config.lifePointsEnabled) {
                    await ddcsController.removeLifePoints(
                        curIPlayer,
                        curIUnit,
                        "Friendly Kill",
                        true,
                        6
                    );
                }

                if (curTUnit.inAir && ddcsController.config.lifePointsEnabled) {
                    await ddcsController.addLifePoints(
                        curTPlayer,
                        curTUnit
                    );
                }

                mesg = "A: " + ddcsController.side[iPlayer.side] + " " + iPlayer.name + "(" + curIUnit.type +
                    ":-6 LP) has hit friendly " + tPlayer.name + "(" + curTUnit.type + ":+LPLoss) with a " +
                    eventObj.data.arg2 || "?";
                await ddcsController.sendMesgToCoalition(
                    iPlayer.side,
                    mesg,
                    15
                );
            }
        }
    }
}
