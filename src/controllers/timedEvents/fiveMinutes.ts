/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processFiveMinuteActions(fullySynced: boolean): Promise<void> {
    if (fullySynced) {
        await ddcsControllers.checkBaseWarnings();
        await ddcsControllers.recordFiveMinutesPlayed();
        await ddcsControllers.baseDefenseDetectSmoke(); // smokes everything 5km from center of main base

        // preliminary carrier spawn on new sync
        const westCarrierGroupName = "~Carrier|West|Lincoln|Red|";
        const eastCarrierGroupName = "~Carrier|East|Roosevelt|Blue|";

        const westCarrier = await ddcsControllers.unitActionRead({_id: westCarrierGroupName, isActive: false, dead: false});
        const eastCarrier = await ddcsControllers.unitActionRead({_id: eastCarrierGroupName, isActive: false, dead: false});
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
