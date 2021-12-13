/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processTenMinuteActions(fullySynced: boolean): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    if (fullySynced) {
        /* if (engineCache.config.lifePointsEnabled) {
            await ddcsControllers.updateServerLifePoints();            
        } */
        if(engineCache.config.aiConvoysEnabled){
            await ddcsControllers.maintainPvEConfig();
        }
    }
}
