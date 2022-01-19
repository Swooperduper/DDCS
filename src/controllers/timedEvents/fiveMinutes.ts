/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export async function processFiveMinuteActions(fullySynced: boolean): Promise<void> {
    if (fullySynced) {     
        await ddcsControllers.checkBaseWarnings();
        await ddcsControllers.recordFiveMinutesPlayed();
        await ddcsControllers.baseDefenseDetectSmoke(); // smokes everything 5km from center of main base
    }
}
