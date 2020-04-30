/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function checkTroopProx() {
    const troopUnits = await ddcsController.unitActionRead({isTroop: true, dead: false});
    for (const troop of troopUnits) {
        const stParse = _.split(troop.name, "|");
        const playerName = stParse[3];
        const isPlayerProximity = await ddcsController.isPlayerInProximity(troop.lonLatLoc, 1, playerName);
        console.log(
            "Destroying " + playerName + "s " + troop.type + " has been destroyed due to proximity",
            isPlayerProximity,
            !isPlayerProximity
        );
        if (!isPlayerProximity) {
            await ddcsController.destroyUnit(troop.name);
        }
    }
}
