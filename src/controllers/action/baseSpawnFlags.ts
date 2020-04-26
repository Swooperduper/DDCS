/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function setbaseSides() {
    return ddcsController.baseActionGetBaseSides()
        .then((baseSides: any) => {
            return ddcsController.cmdQueActionsSave({
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
