/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processTenMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        if (ddcsControllers.config.lifePointsEnabled) {
            await ddcsControllers.updateServerLifePoints();
        }
    }
}
