/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as localDb from "../db/local";
import * as proxZone from "../proxZone";
import * as spawn from "../spawn";

export async function spawnLogiCrate(crateObj: any, init?: boolean) {
    if (init) {
        const curCrateObj = {
            ...crateObj,
            _id: crateObj.name,
            lonLatLoc: proxZone.getLonLatFromDistanceDirection(crateObj.unitLonLatLoc, crateObj.heading, 0.05)
        };

        await localDb.staticCrateActionSave(curCrateObj);
        await localDb.cmdQueActionsSave({
            actionObj: {
                action: "CMD",
                cmd: spawn.spawnStatic(
                    spawn.staticTemplate(curCrateObj),
                    crateObj.country
                ),
                reqID: 0
            },
            queName: "clientArray"
        });
    } else {
        await localDb.cmdQueActionsSave({
            actionObj: {
                action: "CMD",
                cmd: spawn.spawnStatic(
                    spawn.staticTemplate(crateObj),
                    crateObj.country
                ),
                reqID: 0
            },
            queName: "clientArray"
        });
    }
}
