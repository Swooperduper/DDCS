/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

const aIMaxIdleTime = (5 * 60 * 1000); // 5 mins
const maxCrateLife = (3 * 60 * 60 * 1000); // 3 hrs

export async function processThirtySecActions(fullySynced: boolean) {
    if (fullySynced) {

        await ddcsController.unitActionRemoveAllDead();
        await ddcsController.checkTimeToRestart();
        if (ddcsController.config.lifePointsEnabled) {
            await ddcsController.checkAircraftCosts();
        }

        await ddcsController.checkAircraftWeaponCompliance();

        await ddcsController.aliveJtac30SecCheck();

        await ddcsController.checkCmdCenters();

        // cleanupAI aIMaxIdleTime
        const aICleanup = await ddcsController.unitActionRead({isAI: true, dead: false});
        for (const aIUnit of aICleanup) {
            if (_.isEmpty(aIUnit.playername) && new Date(aIUnit.updatedAt).getTime() + aIMaxIdleTime < new Date().getTime()) {
                await ddcsController.destroyUnit( aIUnit.name );
            }
        }

        const crateCleanup = await ddcsController.staticCrateActionReadStd({});
        for (const crate of crateCleanup) {
            if (new Date(crate.createdAt).getTime() + maxCrateLife < new Date().getTime()) {
                await ddcsController.staticCrateActionDelete({_id: crate._id})
                console.log("cleanup crate: ", crate.name);
                await ddcsController.destroyUnit( crate.name );
            }
        }
    }
}
