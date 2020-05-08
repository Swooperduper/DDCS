/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function sendMissingUnits(serverUnitArray: ddcsController.IServer[]) {
    await ddcsController.unitActionChkResync();
    for (const unitName of serverUnitArray) {
        await ddcsController.unitActionUpdate({_id: unitName, isResync: true, dead: false});
    }
    const units = await ddcsController.unitActionRead({isResync: false, dead: false});
    console.log("DB RESYNC, SERVER -> DB");
    // dont remove units, only add
    await ddcsController.unitActionUpdate({
        _id: units[0].name,
        name: units[0].name,
        dead: true
    });
}
