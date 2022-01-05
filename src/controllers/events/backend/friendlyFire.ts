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
                    await ddcsControllers.removeWarbonds(
                        curIPlayer,
                        curIUnit,
                        "Friendly Kill",
                        true,
                        6
                    );
                }

                if (curTUnit.inAir && engineCache.config.lifePointsEnabled) {
                    await ddcsControllers.addWarbonds(
                        curTPlayer,
                        curTUnit
                    );
                }

                await ddcsControllers.sendMesgToCoalition(
                    iPlayer.side,
                    "HASHITFRIENDLY",
                    [
                        "#1",
                        iPlayer.name,
                        curIUnit.type,
                        tPlayer.name,
                        curTUnit.type,
                        eventObj.data.arg2
                    ],
                    15
                );
            }
        }
    }
}
