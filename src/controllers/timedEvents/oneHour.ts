/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as repairController from "../menu/repair";

export function processOneHourActions(fullySynced: boolean) {
    if (fullySynced) {
        repairController.repairBaseSAMRadars();
    }
}
