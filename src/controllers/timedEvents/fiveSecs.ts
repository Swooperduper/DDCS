/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function processFiveSecActions(fullySynced: boolean): Promise<void> {
    const replenThreshold = 1; // percentage under max
    const replenBase = ddcsController.config.replenThresholdBase * replenThreshold;
    const replenTimer = _.random(ddcsController.config.replenTimer / 2, ddcsController.config.replenTimer);

    if (fullySynced) {
        // resetCampaignController.checkTimeToRestart(serverName); //for testing base capture quickly
        // set base flags
        const bases = await ddcsController.baseActionRead({baseType: "MOB"});
        for (const base of bases) {
            const curRegEx = "^" + base._id + " #";
            const unitCnt = replenBase;
            const units = await ddcsController.unitActionRead({name: new RegExp(curRegEx), dead: false});
            const replenEpoc = new Date(base.replenTime).getTime();
            const aliveComms = await ddcsController.unitActionRead({name: base.name + " Communications", dead: false});
            if (aliveComms.length > 0) {
                if ((units.length < unitCnt) && replenEpoc < new Date().getTime()) { // UNCOMMENT OUT FALSE
                    await ddcsController.baseActionUpdateReplenTimer({
                        name: base._id,
                        replenTime: new Date().getTime() + (replenTimer * 1000)
                    });
                    await ddcsController.spawnSupportPlane(base, base.side);
                }
            }
        }
        await ddcsController.checkUnitsToBaseForCapture();
    }
}
