/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {I18nResolver} from "i18n-ts";

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

export async function sendMesgToAll(
    messageTemplate: string,
    argArray: any[],
    time: number,
    delayTime?: number
): Promise<void> {
    // send to everyone individually
    const latestSession = await ddcsController.sessionsActionsReadLatest();
    const engineCache = ddcsController.getEngineCache();
    if (latestSession) {
        const playerArray = await ddcsController.srvPlayerActionsRead({sessionName: latestSession.name});
        if (playerArray.length > 0) {
            for (const player of playerArray) {
                const playerUnits = await ddcsController.unitActionRead({dead: false, playername: player.name});
                const curPlayerUnit = playerUnits[0];
                if (playerUnits.length > 0) {
                    const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
                    let message = "A: " + i18n[messageTemplate];
                    for (const [i, v] of argArray.entries()) {
                        const templateReplace = "#" + (i + 1);
                        const templateVal = (_.includes(v, "#")) ? i18n[v.split("#")[1]] : v;
                        message = message.replace(templateReplace, templateVal);
                    }
                    await sendMesgToGroup(
                        curPlayerUnit.groupId,
                        message,
                        time,
                        delayTime
                    );
                }
            }
        }
    }
    /*
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outText([[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        timeToExecute: delayTime
    });
     */
}

export async function sendMesgToCoalition(
    coalition: number,
    messageTemplate: string,
    argArray: any[],
    time: number,
    delayTime?: number
): Promise<void> {
    // send to everyone individually
    const latestSession = await ddcsController.sessionsActionsReadLatest();
    const engineCache = ddcsController.getEngineCache();
    if (latestSession) {
        const playerArray = await ddcsController.srvPlayerActionsRead({sessionName: latestSession.name});
        if (playerArray.length > 0) {
            for (const player of playerArray) {
                const playerUnits = await ddcsController.unitActionRead({dead: false, coalition, playername: player.name});
                const curPlayerUnit = playerUnits[0];
                if (playerUnits.length > 0) {
                    const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
                    const message = "C: " + i18n[messageTemplate];
                    for (const [i, v] of argArray.entries()) {
                        message.replace("#" + i, (_.includes(v, "#") ? i18n[v] : v ));
                    }
                    await sendMesgToGroup(
                        curPlayerUnit.groupId,
                        message,
                        time,
                        delayTime
                    );
                }
            }
        }
    }
    /*
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForCoalition(" + coalition + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        timeToExecute: delayTime
    });
     */
}

export async function sendMesgToGroup(groupId: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "CMD",
            cmd: ["trigger.action.outTextForGroup(" + groupId + ", [[" + mesg + "]], " + time + ")"],
            reqID: 0
        },
        timeToExecute: delayTime
    });
}
