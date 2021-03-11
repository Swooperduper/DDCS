/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";

export async function forcePlayerSpectator(playerId: string, mesg: string): Promise<void> {

    await ddcsController.sendUDPPacket("backEnd", {
        action: "CMD",
        cmd: `net.force_player_slot('${playerId}', 0, "")`,
        reqID: 0
    });

    await sendMesgToPlayerChatWindow(mesg, playerId);
}

export async function kickPlayer(playerId: number, mesg: string): Promise<void> {
    await ddcsController.sendUDPPacket("backEnd", {
        action: "CMD",
        cmd: "net.kick(" + playerId + ", [[" + mesg + "]])",
        reqID: 0
    });
}

export async function loadMission(missionName: string): Promise<void> {
    await ddcsController.sendUDPPacket("backEnd", {
        action: "CMD",
        cmd: "net.load_mission([[" + missionName + "]])",
        reqID: 0
    });
}

export async function sendMesgChatWindow(mesg: string): Promise<void> {
    await ddcsController.sendUDPPacket("backEnd", {
        action: "CMD",
        cmd: `net.send_chat([[${mesg}]], true)`,
        reqID: 0
    });
}

export async function sendMesgToPlayerChatWindow(mesg: string, playerId: string): Promise<void> {
    await ddcsController.sendUDPPacket("backEnd", {
        action: "CMD",
        cmd: `net.send_chat_to([[${mesg}]], ${playerId})`,
        reqID: 0
    });
}

export async function sendMesgToAll(mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: "trigger.action.outText([[" + mesg + "]], " + time + ")",
            reqID: 0
        },
        timeToExecute: delayTime
    });
}

export async function sendMesgToCoalition(coalition: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: "trigger.action.outTextForCoalition(" + coalition + ", [[" + mesg + "]], " + time + ")",
            reqID: 0
        },
        timeToExecute: delayTime
    });
}

export async function sendMesgToGroup(groupId: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: "trigger.action.outTextForGroup(" + groupId + ", [[" + mesg + "]], " + time + ")",
            reqID: 0
        },
        timeToExecute: delayTime
    });
}

export async function setIsOpenSlotFlag(lockFlag: number): Promise<void> {
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "SETISOPENSLOT",
            val: lockFlag
        }
    });
}
