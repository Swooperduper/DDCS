/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as localDb from "../db/local";

export async function setbaseSides(): Promise<void> {
    const baseSides = await localDb.baseActionGetBaseSides();
    await localDb.cmdQueActionsSave({
        queName: "clientArray",
        actionObj: {
            action: "SETBASEFLAGS",
            data: baseSides
        }
    })
        .catch((err) => {
            console.log("17", err);
        });
}
