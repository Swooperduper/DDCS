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
async function shutdown(callback: { (output: any): void; (arg0: any): any; }) {
    await exec("shutdown.exe /r /t 00", (error: any, stdout: any) => callback(stdout) );
}

export async function checkTimeToRestart() {
    if (timeToRestart !== 0) {
        if (new Date().getTime() > timeToRestart) {
            await restartCampaign();
        }
    }
}

export async function clearCampaignTables() {
    console.log("clearTables");
    await ddcsController.cmdQueActionsRemoveAll();
    await ddcsController.staticCrateActionRemoveall();
    await ddcsController.unitActionRemoveall();
}

export async function restartCampaign() {
    console.log("ALL TABLES CLEARED OFF, restart");
    if (ddcsController.config.fullServerRestartOnCampaignWin) {
        await shutdown((output: any) => {
            console.log(output);
        });
    } else {
        await ddcsController.restartServer();
    }
}
