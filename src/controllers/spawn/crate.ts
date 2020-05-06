/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function spawnLogiCrate(crateObj: any, init?: boolean) {
    if (init) {
        const curCrateObj = {
            ...crateObj,
            _id: crateObj.name,
            lonLatLoc: ddcsController.getLonLatFromDistanceDirection(crateObj.unitLonLatLoc, crateObj.heading, 0.05)
        };

        await ddcsController.staticCrateActionSave(curCrateObj);
        await ddcsController.cmdQueActionsSave({
            actionObj: {
                action: "CMD",
                cmd: ddcsController.spawnStatic(
                    ddcsController.staticTemplate(curCrateObj),
                    crateObj.country
                ),
                reqID: 0
            },
            queName: "clientArray"
        });
    } else {
        await ddcsController.cmdQueActionsSave({
            actionObj: {
                action: "CMD",
                cmd: ddcsController.spawnStatic(
                    ddcsController.staticTemplate(crateObj),
                    crateObj.country
                ),
                reqID: 0
            },
            queName: "clientArray"
        });
    }
}
