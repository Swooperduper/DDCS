/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as masterDBController from "../db";
import * as zoneController from "../proxZone/zone";
import * as groupController from "./group";

export async function spawnLogiCrate(crateObj: any, init?: boolean) {
    if (init) {
        const curCrateObj = {
            ...crateObj,
            _id: crateObj.name,
            lonLatLoc: zoneController.getLonLatFromDistanceDirection(crateObj.unitLonLatLoc, crateObj.heading, 0.05)
        };

        return masterDBController.staticCrateActionSave(curCrateObj)
            .then(() => {
                masterDBController.cmdQueActionsSave({
                    actionObj: {
                        action: "CMD",
                        cmd: groupController.spawnStatic(
                            groupController.staticTemplate(curCrateObj),
                            crateObj.country
                        ),
                        reqID: 0
                    },
                    queName: "clientArray"
                })
                    .catch((err) => {
                        console.log("erroring line23: ", err);
                    });
            })
            .catch((err) => {
                console.log("erroring line17: ", err);
            });
    } else {
        return masterDBController.cmdQueActionsSave({
            actionObj: {
                action: "CMD",
                cmd: groupController.spawnStatic(
                    groupController.staticTemplate(crateObj),
                    crateObj.country
                ),
                reqID: 0
            },
            queName: "clientArray"
        })
            .catch((err) => {
                console.log("erroring line37: ", err);
            });
    }
}

