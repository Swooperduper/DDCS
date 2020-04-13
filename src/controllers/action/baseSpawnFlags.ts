/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as masterDBController from "../db";

export async function setbaseSides() {
    return masterDBController.baseActionGetBaseSides()
        .then((baseSides: any) => {
            return masterDBController.cmdQueActionsSave({
                queName: "clientArray",
                actionObj: {
                    action: "SETBASEFLAGS",
                    data: baseSides
                }
            });
        })
        .catch((err: any) => {
            console.log("line1491", err);
        });
}
