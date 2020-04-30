/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as constants from "../constants";
import * as ddcsController from "../";

const delayTask = constants.time.oneMin;

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
        timeToExecute: new Date().getTime() + delayTask
    };
    await ddcsController.cmdQueActionsSave(actionObj);
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
        timeToExecute: new Date().getTime() + delayTask
    };
    await ddcsController.cmdQueActionsSave(actionObj);
}
