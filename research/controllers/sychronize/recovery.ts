/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as localDb from "../db/local";
import * as typing from "../../typings";

export async function sendMissingUnits(serverUnitArray: typing.IServer[]) {
    await localDb.unitActionChkResync();
    for (const unitName of serverUnitArray) {
        await localDb.unitActionUpdate({_id: unitName, isResync: true, dead: false});
    }
    const units = await localDb.unitActionRead({isResync: false, dead: false});
    console.log("DB RESYNC, SERVER -> DB");
    // dont remove units, only add
    await localDb.unitActionUpdate({
        _id: units[0].name,
        name: units[0].name,
        dead: true
    });
}
