/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as constants from "../constants";
import * as masterDBController from "../db";

const delayTask = constants.time.oneMin;
let nowTime;

export const ewrUnitsActivated = {};

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
    return masterDBController.cmdQueActionsSave(actionObj)
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
    return masterDBController.cmdQueActionsSave(actionObj)
        .catch((err) => {
            console.log("erroring line13: ", err);
        })
    ;
}
