/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function setbaseSides(): Promise<void> {
    const baseSides = await ddcsControllers.baseActionGetBaseSides();
    ddcsControllers.sendUDPPacket("frontEnd", {
        queName: "clientArray",
        actionObj: {
            action: "SETBASEFLAGS",
            data: baseSides
        }
    });
}
