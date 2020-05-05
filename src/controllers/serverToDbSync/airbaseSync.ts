/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function processAirbaseUpdates(mapType: string, airbaseObj: ddcsController.IBasePayload): Promise<void> {
    if (airbaseObj.action === "airbaseC") {
        await ddcsController.baseActionSave({
            ...airbaseObj.data,
            mapType
        });
    }
}
