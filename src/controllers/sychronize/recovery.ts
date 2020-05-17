/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typing from "../../typings";
import * as ddcsControllers from "../";

export async function sendMissingUnits(serverUnitArray: typing.IServer[]) {
    await ddcsControllers.unitActionChkResync();
    for (const unitName of serverUnitArray) {
        await ddcsControllers.unitActionUpdate({_id: unitName, isResync: true, dead: false});
    }
    const units = await ddcsControllers.unitActionRead({isResync: false, dead: false});
    console.log("DB RESYNC, SERVER -> DB");
    // dont remove units, only add
    await ddcsControllers.unitActionUpdate({
        _id: units[0].name,
        name: units[0].name,
        dead: true
    });
}
