/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as eventHitController from "../events/frontend/S_EVENT_HIT";


export function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        eventHitController.checkShootingUsers();

        // proximityController.checkUnitsToBaseForTroops(serverName);

        // proximityController.checkUnitsToLogisticTowers(serverName);
    }
}

