/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as masterDBController from "../db";

export async function forcePlayerSpectator(playerId: number, mesg: string) {

    const forcePromise: any[] = [];

    forcePromise.push(masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.force_player_slot(" + playerId + ", 0, \"\")",
            reqID: 0
        },
        queName: "gameGuiArray"
    })
        .catch((err) => {
            console.log("erroring line65: ", err);
        }));

    forcePromise.push(masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.send_chat([[" + mesg + "]], all)",
            reqID: 0
        },
        queName: "gameGuiArray"
    })
        .catch((err) => {
            console.log("erroring line73: ", err);
        }));

    return Promise.all(forcePromise)
        .catch((err) => {
            console.log("error line38: ", err);
        });
}

export async function kickPlayer(playerId: number, mesg: string) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.kick(" + playerId + ", [[" + mesg + "]])",
            reqID: 0
        },
        queName: "gameGuiArray"
    })
        .catch((err) => {
            console.log("erroring line56: ", err);
        })
    ;
}

export async function loadMission(missionName: string) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.load_mission([[" + missionName + "]])",
            reqID: 0
        },
        queName: "gameGuiArray"
    })
        .catch((err) => {
            console.log("erroring line65: ", err);
        })
    ;
}

export async function sendMesgChatWindow(mesg: string) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.send_chat([[" + mesg + "]], true)",
            reqID: 0
        },
        queName: "gameGuiArray"
    })
        .catch((err) => {
            console.log("erroring line45: ", err);
        })
    ;
}

export async function sendMesgToAll(mesg: string, time: number, delayTime?: number) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outText([[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    })
        .catch((err) => {
            console.log("erroring line16: ", err);
        })
    ;
}

export async function sendMesgToCoalition(coalition: number, mesg: string, time: number, delayTime?: number) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForCoalition(" + coalition + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    })
        .catch((err: any) => {
            console.log("erroring line27: ", err);
        })
    ;
}

export async function sendMesgToGroup(groupId: number, mesg: string, time: number, delayTime?: number) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForGroup(" + groupId + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    })
        .catch((err) => {
            console.log("erroring line38: ", err);
        })
    ;
}

export async function setIsOpenSlotFlag(lockFlag: number) {
    return masterDBController.cmdQueActionsSave({
        actionObj: {
            action: "SETISOPENSLOT",
            val: lockFlag
        },
        queName: "clientArray"
    })
        .catch((err: any) => {
            console.log("erroring line38: ", err);
        })
    ;
}
