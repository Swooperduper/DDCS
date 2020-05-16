/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as remoteDb from "../db/remote";

export async function sendToAll(pData: any): Promise<void> {
    for (let x = 0; x <= 3; x++) {
        pData.side = x;
        await remoteDb.masterQueSave(pData);
    }
}

export function sendToCoalition(pData: any): void {
    const coalition = pData.payload.data.coalition;
    const displaySide = pData.payload.data.displaySide;

    if (coalition) {
        pData.side = coalition;
    } else if (displaySide) {
        pData.side = displaySide;
    } else {
        console.log("no sendToCoalition side for ", pData);
    }
}
