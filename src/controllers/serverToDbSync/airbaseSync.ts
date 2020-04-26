/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as masterDBController from "../db";

export async function processAirbaseUpdates(mapType: string, airbaseObj: any) {
    const curData = {
        ...airbaseObj.data,
        mapType
    };

    if (airbaseObj.action === "airbaseC") {
        masterDBController.baseActionSave(curData)
            .catch((err) => {
                console.log("err line:11 ", err);
            });
    }
}
