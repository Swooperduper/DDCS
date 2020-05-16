/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as localDb from "../db/local";
import * as typing from "../../typings";

export async function processAirbaseUpdates(mapType: string, airbaseObj: typing.IBasePayload): Promise<void> {
    if (airbaseObj.action === "airbaseC") {
        await localDb.baseActionSave({
            ...airbaseObj.data,
            mapType
        });
    }
}
