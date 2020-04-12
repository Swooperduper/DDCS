/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db/masterDB";


export function setbaseSides(serverName: string) {
    return masterDBController.baseActions("getBaseSides", serverName, {})
        .then((baseSides: any[]) => {
            return masterDBController.cmdQueActions("save", serverName, {
                queName: "clientArray",
                actionObj: {
                    action: "SETBASEFLAGS",
                    data: baseSides
                }
            });
        })
        .catch((err: any) => {
            console.log("line1491", err);
        });
}
