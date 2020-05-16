/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as action from "../action";
import * as constants from "../../";
import * as localDb from "../db/local";
import * as spawn from "../spawn";

const aIMaxIdleTime = (5 * 60 * 1000); // 5 mins
const maxCrateLife = (3 * 60 * 60 * 1000); // 3 hrs

export async function processThirtySecActions(fullySynced: boolean) {
    if (fullySynced) {

        await localDb.unitActionRemoveAllDead();
        await action.checkTimeToRestart();
        if (constants.config.lifePointsEnabled) {
            await action.checkAircraftCosts();
        }

        await action.checkAircraftWeaponCompliance();

        await action.aliveJtac30SecCheck();

        await action.checkCmdCenters();

        // cleanupAI aIMaxIdleTime
        const aICleanup = await localDb.unitActionRead({isAI: true, dead: false});
        for (const aIUnit of aICleanup) {
            if (_.isEmpty(aIUnit.playername) && new Date(aIUnit.updatedAt).getTime() + aIMaxIdleTime < new Date().getTime()) {
                await spawn.destroyUnit( aIUnit.name );
            }
        }

        const crateCleanup = await localDb.staticCrateActionReadStd({});
        for (const crate of crateCleanup) {
            if (new Date(crate.createdAt).getTime() + maxCrateLife < new Date().getTime()) {
                await localDb.staticCrateActionDelete({_id: crate._id});
                console.log("cleanup crate: ", crate.name);
                await spawn.destroyUnit( crate.name );
            }
        }
    }
}
