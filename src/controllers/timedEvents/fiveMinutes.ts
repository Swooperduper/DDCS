/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function processFiveMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        await ddcsController.checkBaseWarnings();
        await ddcsController.recordFiveMinutesPlayed();
    }
}
