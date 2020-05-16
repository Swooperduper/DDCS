/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../";
import * as localDb from "../db/local";
import * as proxZone from "../proxZone";
import * as spawn from "../spawn";

export async function processFiveSecActions(fullySynced: boolean): Promise<void> {
    const replenThreshold = 1; // percentage under max
    const replenBase = constants.config.replenThresholdBase * replenThreshold;
    const replenTimer = _.random(constants.config.replenTimer / 2, constants.config.replenTimer);

    if (fullySynced) {
        // resetCampaignController.checkTimeToRestart(serverName); //for testing base capture quickly
        // set base flags
        const bases = await localDb.baseActionRead({baseType: "MOB"});
        for (const base of bases) {
            const curRegEx = "^" + base._id + " #";
            const unitCnt = replenBase;
            const units = await localDb.unitActionRead({name: new RegExp(curRegEx), dead: false});
            const replenEpoc = new Date(base.replenTime).getTime();
            const aliveComms = await localDb.unitActionRead({name: base.name + " Communications", dead: false});
            if (aliveComms.length > 0) {
                if ((units.length < unitCnt) && replenEpoc < new Date().getTime()) { // UNCOMMENT OUT FALSE
                    await localDb.baseActionUpdateReplenTimer({
                        name: base._id,
                        replenTime: new Date().getTime() + (replenTimer * 1000)
                    });
                    await spawn.spawnSupportPlane(base, base.side);
                }
            }
        }
        await proxZone.checkUnitsToBaseForCapture();
    }
}
