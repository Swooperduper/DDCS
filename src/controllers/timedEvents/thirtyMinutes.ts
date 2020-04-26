/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as aiConvoysController from "../action/aiConvoys";

export function processThirtyMinuteActions(fullySynced: boolean) {
    if (fullySynced) {
        aiConvoysController.maintainPvEConfig()
            .catch((err) => {
                console.log("err line16: ", err);
            });
    }
}
