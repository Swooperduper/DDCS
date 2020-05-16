/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as menu from "../menu";

export async function processOneHourActions(fullySynced: boolean) {
    if (fullySynced) {
        await menu.repairBaseSAMRadars();
    }
}
