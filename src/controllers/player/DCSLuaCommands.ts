/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {I18nResolver} from "i18n-ts";
import {ISrvPlayers} from "../../typings";

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
    const engineCache = ddcsController.getEngineCache();
    const playerArray = ddcsController.getRTPlayerArray();
    if (playerArray.length > 0) {
        for (const player of playerArray) {
            const playersInfo = await ddcsController.srvPlayerActionsRead({_id: player._id});
            if (playersInfo[0] && playersInfo[0].displayAllMessages) {
                const playerUnits = await ddcsController.unitActionRead({dead: false, playername: playersInfo[0].name});
                const curPlayerUnit = playerUnits[0] || {};
                const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
                let message = "A: " + i18n[messageTemplate];
                for (const [i, v] of argArray.entries()) {
                    const templateReplace = "#" + (i + 1);
                    const templateVal = (_.includes(v, "#")) ? i18n[v.split("#")[1]] : v;
                    message = message.replace(templateReplace, templateVal);
                }
                await sendMesgToGroup(
                    playersInfo[0],
                    curPlayerUnit.groupId,
                    message,
                    time,
                    delayTime
                );
            }
        }
    }
}

export async function sendMesgToCoalition(
    coalition: number,
    messageTemplate: string,
    argArray: any[],
    time: number,
    delayTime?: number
): Promise<void> {
    // send to everyone individually
    const engineCache = ddcsController.getEngineCache();
    const playerArray = ddcsController.getRTPlayerArray();
    if (playerArray.length > 0) {
        for (const player of playerArray) {
            const playersInfo = await ddcsController.srvPlayerActionsRead({_id: player._id});
            if (playersInfo[0] && playersInfo[0].displayCoalitionMessages) {
                const playerUnits = await ddcsController.unitActionRead({dead: false, coalition, playername: playersInfo[0].name});
                const curPlayerUnit = playerUnits[0] || {};
                const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
                let message = "C: " + i18n[messageTemplate];
                for (const [i, v] of argArray.entries()) {
                    const templateReplace = "#" + (i + 1);
                    const templateVal = (_.includes(v, "#")) ? i18n[v.split("#")[1]] : v;
                    message = message.replace(templateReplace, templateVal);
                }
                await sendMesgToGroup(
                    playersInfo[0],
                    curPlayerUnit.groupId,
                    message,
                    time,
                    delayTime
                );
            }
        }
    }
}

export async function sendMesgToGroup(player: ISrvPlayers, groupId: number, mesg: string, time: number, delayTime?: number): Promise<void> {
    if (player.displayGroupMessages) {
        if (_.includes(player.slot, "instructor") ||
            _.includes(player.slot, "forward_observer") ||
            _.includes(player.slot, "artillery_commander")
        ) {
            console.log("toChat: ", mesg, player.playerId, player.name);
            await sendMesgToPlayerChatWindow(mesg, player.playerId);
        } else {
            await ddcsController.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: ["trigger.action.outTextForGroup(" + groupId + ", [[" + mesg + "]], " + time + ")"],
                    reqID: 0
                },
                timeToExecute: delayTime
            });
        }
    }
}
