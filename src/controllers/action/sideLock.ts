/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";
import {I18nResolver} from "i18n-ts";

export async function lockUserToSide(incomingObj: any, lockToSide: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const curPlayerArray = await ddcsController.srvPlayerActionsRead({_id: incomingObj.from});
        const curPly = curPlayerArray[0];
        const engineCache = ddcsController.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
        if (curPly && curPly.sideLock !== 0) {
            const mesg = i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            resolve();
        } else {
            const mesg = i18n.PLAYERISNOWLOCKEDTOSIDE.replace("#1", i18n[lockToSide].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            await ddcsController.srvPlayerActionsUpdate({_id: incomingObj.from, sideLock: lockToSide});
            resolve();
        }
        resolve();
    });
}

export async function balanceUserToSide(incomingObj: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const curPlayerArray = await ddcsController.srvPlayerActionsRead({_id: incomingObj.from});
        const curPly = curPlayerArray[0];
        const engineCache = ddcsController.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
        if (curPly && curPly.sideLock !== 0) {
            const mesg = i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            resolve();
        } else {
            const currentCampaign = await ddcsController.campaignsActionsReadLatest();
            let lockToSide = 0
            if (currentCampaign.totalMinutesPlayed_blue > currentCampaign.totalMinutesPlayed_red){
                lockToSide = 1
            } else {
                lockToSide = 2
            }
            const mesg = i18n.PLAYERISNOWLOCKEDTOSIDE.replace("#1", i18n[lockToSide].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            await ddcsController.srvPlayerActionsUpdate({_id: incomingObj.from, sideLock: lockToSide});
            resolve();
        }
        resolve();
    });
}

export async function swapUserToLosingSide(incomingObj: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const curPlayerArray = await ddcsController.srvPlayerActionsRead({_id: incomingObj.from});
        const curPly = curPlayerArray[0];
        const engineCache = ddcsController.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
        if (curPly && curPly.sideLock == 0) {
            const mesg = "You are not currently locked to any side, please use -balance, -red or -blue";
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            resolve();
        } else {
            const currentRedBases = await ddcsController.baseActionRead({
                side: 1,
                enabled: true
            });
            const currentBlueBases = await ddcsController.baseActionRead({
                side: 2,
                enabled: true
            });

            let lockToSide = 0
            if (currentRedBases.length < 10){
                lockToSide = 1
            } else if (currentBlueBases.length < 10) {
                lockToSide = 2
            }
            if(lockToSide = 0){
                const mesg = "You cannot swap teams right now, the other team isn't losing that badly just yet, they still have more than 10 bases.";
                await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            } else {
                const mesg = i18n.PLAYERISNOWLOCKEDTOSIDE.replace("#1", i18n[lockToSide].toUpperCase());
                await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
                await ddcsController.srvPlayerActionsUpdate({_id: incomingObj.from, sideLock: lockToSide});
            }
            resolve();
        }
        resolve();
    });
}
