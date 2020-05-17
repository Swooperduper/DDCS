/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function setbaseSides(): Promise<void> {
    const baseSides = await ddcsControllers.baseActionGetBaseSides();
    await ddcsControllers.cmdQueActionsSave({
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
