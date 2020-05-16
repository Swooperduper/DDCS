/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as frontEnd from "../events/frontend";

export async function processOneSecActions(fullySynced: boolean) {
    if (fullySynced) {
        await frontEnd.checkShootingUsers();
    }
}

