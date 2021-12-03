/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../typings";
import * as ddcsController from "../";
import {I18nResolver} from "i18n-ts";

let currentSeconds = 0;
let maxTime = 0;
let messageTemplate;
let args: any[] = [];

export let timerObj = {
    tenHours: false,
    nineHours: false,
    eightHours: false,
    sevenHours: false,
    sixHours: false,
    fivePointEight: false,
    fiveHours: false,
    fourHours: false,
    threeHours: false,
    twoHours: false,
    oneHour: false,
    thirtyMinutes: false,
    twentyMinutes: false,
    tenMinutes: false,
    fiveMinutes: false,
    fourMinutes: false,
    threeMinutes: false,
    twoMinutes: false,
    oneMinute: false
};

export function getMaxTime(): number {
    return maxTime;
}

export function getCurSeconds(): number {
    return currentSeconds;
}

export function setMaxTime(curMaxTime: number): void {
    maxTime = curMaxTime;
}


export function setCurSeconds(curSeconds: number): void {
    currentSeconds = curSeconds;
}

export async function processTimer(serverSecs: number): Promise<void> {
    // console.log("ABS TIME: ", ddcsController.getStartAbsTime());
    setMaxTime((ddcsController.getStartAbsTime() + ddcsController.getEngineCache().config.restartTime) * 1000);
    messageTemplate = null;
    args = [];
    setCurSeconds(serverSecs * 1000);

    if (getMaxTime() > 0) {
        // 10 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 10)) && !timerObj.tenHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["10", "#HOURS"];
            //await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.tenHours = true;
        }
        // 9 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 9)) && !timerObj.nineHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["9", "#HOURS"];
            //await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.nineHours = true;
        }
        // 8 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 8)) && !timerObj.eightHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["8", "#HOURS"];
            //await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.eightHours = true;
        }
        // 7 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 7)) && !timerObj.sevenHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["7", "#HOURS"];
            //await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.sevenHours = true;
            //await ddcsController.setCircleMarkers();
            //await ddcsController.setFarpMarks();
        }
        // 6 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 6)) && !timerObj.sixHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["6", "#HOURS"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.sixHours = true;
            //await ddcsController.setCircleMarkers();
            //await ddcsController.setFarpMarks();
        }
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 5.8)) && !timerObj.fivePointEight) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["6", "#HOURS"];
            //await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.fivePointEight = true;
            await ddcsController.setCircleMarkers();
            await ddcsController.setFarpMarks();
        }
        // 5 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 5)) && !timerObj.fiveHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["5", "#HOURS"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.fiveHours = true;
            //await ddcsController.setCircleMarkers();
            //await ddcsController.setFarpMarks();
        }
        // 4 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 4)) && !timerObj.fourHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["4", "#HOURS"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.fourHours = true;
        }
        // 3 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 3)) && !timerObj.threeHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["3", "#HOURS"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.threeHours = true;
        }
        // 2 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsController.time.oneHour * 2)) && !timerObj.twoHours) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["2", "#HOURS"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.twoHours = true;
        }
        // 1 hour
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.oneHour) && !timerObj.oneHour) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["1", "#HOUR"];
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than " +args[0]+" hours");
            timerObj.oneHour = true;
        }
        // 30 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.thirtyMinutes) && !timerObj.thirtyMinutes) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["30", "#MINUTES"];
            timerObj.thirtyMinutes = true;
        }
        // 20 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.twentyMinutes) && !timerObj.twentyMinutes) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["20", "#MINUTES"];
            timerObj.twentyMinutes = true;
        }
        // 10 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.tenMinutes) && !timerObj.tenMinutes) {
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than 10 Minutes");
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["10", "#MINUTES"];
            timerObj.tenMinutes = true;
        }
        // 5 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.fiveMins) && !timerObj.fiveMinutes) {
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than 5 Minutes");
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["5", "#MINUTES"];
            timerObj.fiveMinutes = true;
        }
        // 4 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.fourMins) && !timerObj.fourMinutes) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["4", "#MINUTES"];
            timerObj.fourMinutes = true;
        }
        // 3 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.threeMinutes) && !timerObj.threeMinutes) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["3", "#MINUTES"];
            timerObj.threeMinutes = true;
        }
        // 2 mins
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.twoMinutes) && !timerObj.twoMinutes) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            args = ["2", "#MINUTES"];
            timerObj.twoMinutes = true;
        }
        // 1 min
        // console.log("SECONDS: ", getCurSeconds(), " > ", getMaxTime(), " - ", 60);
        if (getCurSeconds() > (getMaxTime() - ddcsController.time.oneMin) && !timerObj.oneMinute) {
            messageTemplate = "SERVERRESTARTINGINLESSTHAN";
            await ddcsController.sendMessageToDiscord("Server Restarting In Less Than 1 Minute");
            args = ["1", "#MINUTE"];
            timerObj.oneMinute = true;
            const latestSession = await ddcsController.sessionsActionsReadLatest();
            if (latestSession.name) {
                const playerArray = await ddcsController.srvPlayerActionsRead({ sessionName: latestSession.name });
                for (const player of playerArray) {
                    await ddcsController.kickPlayer(Number(player.playerId), "Server is now restarting!");
                }
            }
        }

        // restart server
        if (getCurSeconds() > getMaxTime()) {
           /* restart server on next or same map depending on rotation
            curTime = new Date().getTime();
            if (curTime > lastSentLoader + ddcsController.time.oneMin) {
                const latestSession = await ddcsController.sessionsActionsReadLatest();
                if (latestSession.name) {
                    const playerArray = await ddcsController.srvPlayerActionsRead({ sessionName: latestSession.name });
                    for (const player of playerArray) {
                        await ddcsController.kickPlayer(Number(player.playerId), "Server is now restarting!");
                    }
                    exports.restartServer();
                }
                lastSentLoader = curTime;
            }*/
            exports.restartServer();
        } else {
            if (messageTemplate) {
                await ddcsController.sendMesgToAll(messageTemplate, args, 20);
            }
        }
    }
}

export async function restartServer(): Promise<void> {
    console.log("restart server");
    await ddcsController.shutdown();
    /*
    const server = await ddcsController.serverActionsRead({});
    const newMap = server[0].curFilePath + "_" + server[0].curSeason + "_" +
        _.random(1, (server[0].mapCount || 1)) + ".miz";
    console.log("Loading Map: ", newMap);
    await ddcsController.loadMission(newMap);
     */
}

export function secondsToHms(d: number, language: string): string {
    const hLeft = d / 3600000;
    const h = Math.floor(hLeft);
    const m = Math.floor(60 * (hLeft - h));
    const engineCache = ddcsController.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, language).translation as any;
    // const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " " + i18n.HOUR + ", " : " " + i18n.HOURS + ", ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " " + i18n.MINUTE + ", " : " " + i18n.MINUTES) : "";
    // const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay;
}

export async function timeLeft(curUnit: typings.IUnit, curPlayer: typings.ISrvPlayers): Promise<void> {
    const formatTime = secondsToHms(getMaxTime() - getCurSeconds(), curPlayer.lang as string);
    const engineCache = ddcsController.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;
    const message = "G: " + i18n.SERVERTIMELEFT.replace("#1", formatTime);

    console.log(message);
    await ddcsController.sendMesgToGroup(curPlayer, curUnit.groupId, message, 5);
}
