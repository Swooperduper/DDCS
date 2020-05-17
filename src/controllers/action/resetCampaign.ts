/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// tslint:disable-next-line:no-var-requires
const exec = require("child_process").exec;

import * as ddcsControllers from "../";

export let timeToRestart = 0;

export function setTimeToRestart(timestamp: number): void {
    timeToRestart = timestamp;
}

// Create shutdown function
async function shutdown(callback: { (output: any): void; (arg0: any): any; }): Promise<void> {
    await exec("shutdown.exe /r /t 00", (error: any, stdout: any) => callback(stdout) );
}

export async function checkTimeToRestart(): Promise<void> {
    if (timeToRestart !== 0) {
        if (new Date().getTime() > timeToRestart) {
            await restartCampaign();
        }
    }
}

export async function clearCampaignTables(): Promise<void> {
    console.log("clearTables");
    await ddcsControllers.cmdQueActionsRemoveAll();
    await ddcsControllers.staticCrateActionRemoveall();
    await ddcsControllers.unitActionRemoveall();
}

export async function restartCampaign(): Promise<void> {
    console.log("ALL TABLES CLEARED OFF, restart");
    if (ddcsControllers.config.fullServerRestartOnCampaignWin) {
        await shutdown((output: any) => {
            console.log(output);
        });
    } else {
        await ddcsControllers.restartServer();
    }
}
