/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as radioTowerController from "../action/radioTower";
import * as minutesPlayedController from "../action/minutesPlayed";

export function processFiveMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        radioTowerController.checkBaseWarnings();
        minutesPlayedController.recordFiveMinutesPlayed();
    }
}
