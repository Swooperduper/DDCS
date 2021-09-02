/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// tslint:disable-next-line:no-var-requires
const exec = require("child_process").exec;

import * as ddcsControllers from "../";

export let timeToRestart = 0;

export function getTimeToRestart(): number {
    return timeToRestart;
}

export function setTimeToRestart(timestamp: number): void {
    timeToRestart = timestamp;
}

// Create shutdown function
export async function shutdown(): Promise<void> {
    await ddcsControllers.sendMessageToDiscord("Server Is Restarting");
    console.log("trying to shutdown");
    await exec("shutdown.exe /r /t 00");
}

export async function checkTimeToRestart(): Promise<void> {
    console.log("CheckTimeToRestart: ", timeToRestart);
    if (timeToRestart !== 0) {
        if (new Date().getTime() > timeToRestart) {
            await restartCampaign();
        }
    }
}

export async function clearCampaignTables(): Promise<void> {
    console.log("clearTables");
    // await ddcsControllers.staticCrateActionRemoveall();
    // await ddcsControllers.unitActionRemoveall();
}

export async function restartCampaign(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    console.log("ALL TABLES CLEARED OFF, restart");
    if (engineCache.config.fullServerRestartOnCampaignWin) {
        await shutdown(); // reboot entire computer
    } else {
        await ddcsControllers.restartServer();
    }
}
