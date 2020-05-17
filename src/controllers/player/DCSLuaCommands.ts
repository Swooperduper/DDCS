/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function forcePlayerSpectator(playerId: string, mesg: string): Promise<void> {

    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.force_player_slot(" + playerId + ", 0, \"\")",
            reqID: 0
        },
        queName: "gameGuiArray"
    });

    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.send_chat([[" + mesg + "]], all)",
            reqID: 0
        },
        queName: "gameGuiArray"
    });
}

export async function kickPlayer(playerId: number, mesg: string): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.kick(" + playerId + ", [[" + mesg + "]])",
            reqID: 0
        },
        queName: "gameGuiArray"
    });
}

export async function loadMission(missionName: string): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.load_mission([[" + missionName + "]])",
            reqID: 0
        },
        queName: "gameGuiArray"
    });
}

export async function sendMesgChatWindow(mesg: string): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: "net.send_chat([[" + mesg + "]], true)",
            reqID: 0
        },
        queName: "gameGuiArray"
    });
}

export async function sendMesgToAll(mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outText([[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    });
}

export async function sendMesgToCoalition(coalition: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForCoalition(" + coalition + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    });
}

export async function sendMesgToGroup(groupId: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForGroup(" + groupId + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        queName: "clientArray",
        timeToExecute: delayTime
    });
}

export async function setIsOpenSlotFlag(lockFlag: number): Promise<void> {
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "SETISOPENSLOT",
            val: lockFlag
        },
        queName: "clientArray"
    });
}
