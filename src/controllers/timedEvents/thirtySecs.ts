/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

const aIMaxIdleTime = ddcsControllers.time.tenMinutes;
const maxCrateLife = (3 * 60 * 60 * 1000); // 3 hrs

export async function processThirtySecActions(fullySynced: boolean) {
    const engineCache = ddcsControllers.getEngineCache();
    if (fullySynced) {
        ddcsControllers.jobArrayCleanup();
        const knownFlags = await ddcsControllers.flagsActionRead({});
        for (const flag in knownFlags){
            console.log("Getting Flag Value for _ID:",knownFlags[flag]._id);
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "getFlagValue",
                    flagID: knownFlags[flag]._id,
                    reqID: 0
                }
            });
        }
        await ddcsControllers.unitActionRemoveAllDead();
        await ddcsControllers.checkTimeToRestart();
        await ddcsControllers.checkAircraftCosts();

        await ddcsControllers.checkAircraftWeaponCompliance();

        await ddcsControllers.aliveJtac30SecCheck();

        await ddcsControllers.getAllDetectedUnitsByNameArray();
        // auto GCI crashing hard leave off, when it finds a bad unit name

        await ddcsControllers.checkCmdCenters();

        // cleanupAI aIMaxIdleTime
        const aICleanup = await ddcsControllers.unitActionRead({isAI: true, dead: false});
        for (const aIUnit of aICleanup) {
            if (_.isEmpty(aIUnit.playername) && new Date(aIUnit.updatedAt).getTime() + aIMaxIdleTime < new Date().getTime()) {
                await ddcsControllers.destroyUnit( aIUnit.name, "unit" );
            }
        }

        const crateCleanup = await ddcsControllers.staticCrateActionReadStd({});
        for (const crate of crateCleanup) {
            if (new Date(crate.createdAt).getTime() + maxCrateLife < new Date().getTime()) {
                await ddcsControllers.staticCrateActionDelete({_id: crate._id});
                console.log("cleanup crate: ", crate.name);
                await ddcsControllers.destroyUnit( crate.name, "static" );
            }
        }
    }
}
