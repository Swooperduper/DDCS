/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as constants from "../../";
import * as localDb from "../db/local";

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
    await localDb.cmdQueActionsSave(actionObj);
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
    await localDb.cmdQueActionsSave(actionObj);
}
