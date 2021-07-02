/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";
import * as ddcsController from "../action/unitDetection";

export async function processFiveSecActions(fullySynced: boolean): Promise<void> {

    const engineCache = ddcsControllers.getEngineCache();
    const replenThreshold = 1; // percentage under max
    const replenBase = engineCache.config.replenThresholdBase * replenThreshold;
    const replenTimer = _.random(engineCache.config.replenTimer / 2, engineCache.config.replenTimer);

    await ddcsControllers.syncCheck(ddcsControllers.getCurServerCnt());
    console.log("SYNCED: ", fullySynced);
    if (fullySynced) {
        // resetCampaignController.checkTimeToRestart(serverName); //for testing base capture quickly
        // spawn support planes to replenish base units
        const bases = await ddcsControllers.baseActionRead({baseType: "MOB"});
        for (const base of bases) {
            const curRegEx = "^" + base._id + " #";
            const unitCnt = replenBase;
            const units = await ddcsControllers.unitActionRead({name: new RegExp(curRegEx), dead: false});
            const replenEpoc = new Date(base.replenTime).getTime();
            const aliveComms = await ddcsControllers.unitActionRead({name: base.name + " Comms tower M", dead: false});
            if (aliveComms.length > 0) {
                if ((units.length < unitCnt) && replenEpoc < new Date().getTime()) {
                    //  if (( (base._id === "Tuapse_MOB") || units.length < unitCnt) && replenEpoc < new Date().getTime()) {
                    await ddcsControllers.baseActionUpdateReplenTimer({
                        name: base._id,
                        replenTime: new Date().getTime() + (replenTimer * 1000)
                    });
                    await ddcsControllers.spawnSupportPlane(base, base.side);
                }
            }
        }
        await ddcsControllers.checkUnitsToBaseForCapture();

        await ddcsControllers.processCommandQue();

        await ddcsControllers.killEnemyWithinSightOfConvoy();

        await ddcsControllers.aiDefendBase();

        await ddcsControllers.baseAWACSUpkeep();

        // preliminary carrier spawn on new sync
        const westCarrierGroupName = "~Carrier|West|Lincoln|Red|";
        const eastCarrierGroupName = "~Carrier|East|Roosevelt|Blue|";

        const westCarrier = await ddcsControllers.unitActionRead({_id: westCarrierGroupName + "1|", isActive: false, dead: false});
        const eastCarrier = await ddcsControllers.unitActionRead({_id: eastCarrierGroupName + "1|", isActive: false, dead: false});

        // console.log("carrer: ", westCarrier.length, eastCarrier.length);
        if (westCarrier.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "Group.getByName(\"" + westCarrierGroupName + "\"):activate()"
                    ],
                    reqID: 0,
                    time: new Date()
                }
            });
        }

        if (eastCarrier.length > 0) {
			await ddcsControllers.setFarpMarks();
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "Group.getByName(\"" + eastCarrierGroupName + "\"):activate()"
                    ],
                    reqID: 0,
                    time: new Date()
                }
            });
        }
    }
}
