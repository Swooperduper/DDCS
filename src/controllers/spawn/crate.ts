/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

export async function spawnLogiCrate(crateObj: any, init?: boolean) {
    if (init) {
        const curCrateObj = _.cloneDeep(crateObj);
        curCrateObj._id = crateObj.name;
        curCrateObj.lonLatLoc = ddcsControllers.getLonLatFromDistanceDirection(crateObj.unitLonLatLoc, crateObj.heading, 0.05);

        await ddcsControllers.staticCrateActionSave(curCrateObj);

        await ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "CMD",
                cmd: [await ddcsControllers.spawnStatic(
                    await ddcsControllers.staticTemplate(curCrateObj),
                    crateObj.country
                )],
                reqID: 0
            }
        });
    } else {
        await ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "CMD",
                cmd: await ddcsControllers.spawnStatic(
                    await ddcsControllers.staticTemplate(crateObj),
                    crateObj.country
                ),
                reqID: 0
            }
        });
    }
}
