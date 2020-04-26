/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as constants from "../constants";
import * as userLivesController from "../action/userLives";

export  function processTenMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        if (constants.config.lifePointsEnabled) {
            userLivesController.updateServerLifePoints();
        }
    }
}
