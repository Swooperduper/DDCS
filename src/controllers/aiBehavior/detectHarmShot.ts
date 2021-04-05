/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function detectHarmShot(event: any) {

    if (event && event.data && event.data.weapon && event.data.weapon.targetName) {
        const currentDetectedUnits = ddcsController.getEwrDetectionUnits();
        const isUnitShotHarmDetected = currentDetectedUnits.find((unitName) => unitName === event.data.weapon.targetName);

        if (isUnitShotHarmDetected) {
            const targetUnit = await ddcsController.unitActionRead({dead: false, _id: event.data.weapon.targetName});

            //get radius around targeted radar, do same behavior to all SAM in small area
        }
    }

}
