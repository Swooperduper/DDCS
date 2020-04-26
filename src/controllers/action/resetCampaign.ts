/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// tslint:disable-next-line:no-var-requires
const exec = require("child_process").exec;

import * as _ from "lodash";
import * as ddcsController from "../";

export let timeToRestart = 0;

export function setTimeToRestart(timestamp: number) {
    timeToRestart = timestamp;
}

// Create shutdown function
function shutdown(callback: { (output: any): void; (arg0: any): any; }) {
    exec("shutdown.exe /r /t 00", (error: any, stdout: any) => callback(stdout) );
}

export function checkTimeToRestart() {
    if (timeToRestart !== 0) {
        if (new Date().getTime() > timeToRestart) {
            restartCampaign();
        }
    }
}

export async function clearCampaignTables() {
    console.log("clearTables");
    const groupPromise: any[] = [];
    groupPromise.push(ddcsController.cmdQueActionsRemoveAll()
        .catch((err: any) => {
            console.log("line 32: ", err);
        }))
    ;
    groupPromise.push(ddcsController.staticCrateActionRemoveall()
        .catch((err: any) => {
            console.log("line 37: ", err);
        }))
    ;
    groupPromise.push(ddcsController.unitActionRemoveall()
        .catch((err: any) => {
            console.log("line 42: ", err);
        }))
    ;
    return Promise.all(groupPromise)
        .catch((err: any) => {
            console.log("line 50: ", err);
        });
}

export function restartCampaign() {
    console.log("ALL TABLES CLEARED OFF, restart");
    if (_.get(ddcsController, "config.fullServerRestartOnCampaignWin", false)) {
        shutdown((output: any) => {
            console.log(output);
        });
    } else {
        ddcsController.restartServer()
            .catch((err) => {
                console.log("line61: ", err);
            });
    }
}
