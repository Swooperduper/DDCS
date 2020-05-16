/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as action from "../action";

export async function processThirtyMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        await action.maintainPvEConfig();
    }
}
