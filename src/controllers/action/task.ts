/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as constants from "../constants";
import * as ddcsController from "../";

const delayTask = constants.time.oneMin;
let nowTime;

export let ewrUnitsActivated = {};

export function resetEWRUnitsActivated() {
    ewrUnitsActivated = {};
}

export async function setEWRTask(unitName: string) {
    nowTime = new Date().getTime();
    const sendClient = {
        action: "ADDTASK",
        taskType: "EWR",
        unitName
    };
    const actionObj = {
        actionObj: sendClient,
        queName: "clientArray",
        timeToExecute: nowTime + delayTask
    };
    return ddcsController.cmdQueActionsSave(actionObj)
        .catch((err) => {
            console.log("erroring line13: ", err);
        })
    ;
}

export async function setMissionTask(groupName: string, route: string) {
    nowTime = new Date().getTime();

    const sendClient = {
        action: "ADDTASK",
        taskType: "Mission",
        groupName,
        route
    };

    const actionObj = {
        actionObj: sendClient,
        queName: "clientArray",
        timeToExecute: nowTime + delayTask
    };
    return ddcsController.cmdQueActionsSave(actionObj)
        .catch((err) => {
            console.log("erroring line13: ", err);
        })
    ;
}
