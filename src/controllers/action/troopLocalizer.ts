/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

export async function checkTroopProx() {
    const troopUnits = await ddcsControllers.unitActionRead({isTroop: true, dead: false});
    for (const troop of troopUnits) {
        const stParse = _.split(troop.name, "|");
        const playerName = stParse[3];
        const isPlayerProximity = await ddcsControllers.isPlayerInProximity(troop.lonLatLoc, 1, playerName);
        console.log(
            "Destroying " + playerName + "s " + troop.type + " has been destroyed due to proximity",
            isPlayerProximity,
            !isPlayerProximity
        );
        if (!isPlayerProximity) {
            await ddcsControllers.destroyUnit(troop.name);
        }
    }
}
