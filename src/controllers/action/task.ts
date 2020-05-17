/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";

export let ewrUnitsActivated = {};

export function resetEWRUnitsActivated() {
    ewrUnitsActivated = {};
}

export async function setEWRTask(unitName: string): Promise<void> {
    const sendClient = {
        action: "ADDTASK",
        taskType: "EWR",
        unitName
    };
    const actionObj = {
        actionObj: sendClient,
        queName: "clientArray",
        timeToExecute: new Date().getTime() + ddcsControllers.time.oneMin
    };
    await ddcsControllers.cmdQueActionsSave(actionObj);
}

export async function setMissionTask(groupName: string, route: string): Promise<void> {

    const sendClient = {
        action: "ADDTASK",
        taskType: "Mission",
        groupName,
        route
    };

    const actionObj = {
        actionObj: sendClient,
        queName: "clientArray",
        timeToExecute: new Date().getTime() + ddcsControllers.time.oneMin
    };
    await ddcsControllers.cmdQueActionsSave(actionObj);
}
