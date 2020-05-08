/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function processTenMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        if (ddcsController.config.lifePointsEnabled) {
            await ddcsController.updateServerLifePoints();
        }
    }
}
