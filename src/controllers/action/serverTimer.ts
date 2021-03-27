/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../typings";
import * as ddcsControllers from "../";

let currentSeconds = 0;
let maxTime = 0;
let mesg;

export let timerObj = {
    tenHours: false,
    nineHours: false,
    eightHours: false,
    sevenHours: false,
    sixHours: false,
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
    // console.log("ABS TIME: ", ddcsControllers.getStartAbsTime());
    setMaxTime((ddcsControllers.getStartAbsTime() + ddcsControllers.getEngineCache().config.restartTime) * 1000);
    mesg = null;
    setCurSeconds(serverSecs * 1000);

    if (getMaxTime() > 0) {
        // 10 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 10)) && !timerObj.tenHours) {
            mesg = "Server is restarting in less than 10 hours!";
            timerObj.tenHours = true;
        }
        // 9 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 9)) && !timerObj.nineHours) {
            mesg = "Server is restarting in less than 9 hours!";
            timerObj.nineHours = true;
        }
        // 8 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 8)) && !timerObj.eightHours) {
            mesg = "Server is restarting in less than 8 hours!";
            timerObj.eightHours = true;
        }
        // 7 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 7)) && !timerObj.sevenHours) {
            mesg = "Server is restarting in less than 7 hours!";
            timerObj.sevenHours = true;
        }
        // 6 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 6)) && !timerObj.sixHours) {
            mesg = "Server is restarting in less than 6 hours!";
            timerObj.sixHours = true;
        }
        // 5 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 5)) && !timerObj.fiveHours) {
            mesg = "Server is restarting in less than 5 hours!";
            timerObj.fiveHours = true;
        }
        // 4 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 4)) && !timerObj.fourHours) {
            mesg = "Server is restarting in less than 4 hours!";
            timerObj.fourHours = true;
        }
        // 3 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 3)) && !timerObj.threeHours) {
            mesg = "Server is restarting in less than 3 hours!";
            timerObj.threeHours = true;
        }
        // 2 hours
        if (getCurSeconds() > (getMaxTime() - (ddcsControllers.time.oneHour * 2)) && !timerObj.twoHours) {
            mesg = "Server is restarting in less than 2 hours!";
            timerObj.twoHours = true;
        }
        // 1 hour
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.oneHour) && !timerObj.oneHour) {
            mesg = "Server is restarting in less than 1 hour!";
            timerObj.oneHour = true;
        }
        // 30 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.thirtyMinutes) && !timerObj.thirtyMinutes) {
            mesg = "Server is restarting in less than 30 minutes!";
            timerObj.thirtyMinutes = true;
        }
        // 20 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.twentyMinutes) && !timerObj.twentyMinutes) {
            mesg = "Server is restarting in less than 20 mins!";
            timerObj.twentyMinutes = true;
        }
        // 10 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.tenMinutes) && !timerObj.tenMinutes) {
            mesg = "Server is restarting in less than 10 mins!";
            timerObj.tenMinutes = true;
        }
        // 5 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.fiveMins) && !timerObj.fiveMinutes) {
            mesg = "Server is restarting in less than 5 minutes!";
            timerObj.fiveMinutes = true;
        }
        // 4 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.fourMins) && !timerObj.fourMinutes) {
            mesg = "Server is restarting in less than 4 minutes!";
            timerObj.fourMinutes = true;
        }
        // 3 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.threeMinutes) && !timerObj.threeMinutes) {
            mesg = "Server is restarting in less than 3 minutes!";
            timerObj.threeMinutes = true;
        }
        // 2 mins
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.twoMinutes) && !timerObj.twoMinutes) {
            mesg = "Server is restarting in less than 2 minutes, Locking Server Down!";
            timerObj.twoMinutes = true;
        }
        // 1 min
        // console.log("SECONDS: ", getCurSeconds(), " > ", getMaxTime(), " - ", 60);
        if (getCurSeconds() > (getMaxTime() - ddcsControllers.time.oneMin) && !timerObj.oneMinute) {
            mesg = "Server is restarting in less than 1 minute, Server Is Locked!";
            timerObj.oneMinute = true;
            const latestSession = await ddcsControllers.sessionsActionsReadLatest();
            if (latestSession.name) {
                const playerArray = await ddcsControllers.srvPlayerActionsRead({ sessionName: latestSession.name });
                for (const player of playerArray) {
                    await ddcsControllers.kickPlayer(Number(player.playerId), "Server is now restarting!");
                }
            }
        }

        // restart server
        if (getCurSeconds() > getMaxTime()) {
           /* restart server on next or same map depending on rotation
            curTime = new Date().getTime();
            if (curTime > lastSentLoader + ddcsControllers.time.oneMin) {
                const latestSession = await ddcsControllers.sessionsActionsReadLatest();
                if (latestSession.name) {
                    const playerArray = await ddcsControllers.srvPlayerActionsRead({ sessionName: latestSession.name });
                    for (const player of playerArray) {
                        await ddcsControllers.kickPlayer(Number(player.playerId), "Server is now restarting!");
                    }
                    exports.restartServer();
                }
                lastSentLoader = curTime;
            }*/
            exports.restartServer();
        } else {
            if (mesg) {
                console.log("serverMesg: ", mesg);
                await ddcsControllers.sendMesgToAll(mesg, 20);
            }
        }
    }
}

export async function restartServer(): Promise<void> {
    console.log("restart server");
    ddcsControllers.shutdown();
    /*
    const server = await ddcsControllers.serverActionsRead({});
    const newMap = server[0].curFilePath + "_" + server[0].curSeason + "_" +
        _.random(1, (server[0].mapCount || 1)) + ".miz";
    console.log("Loading Map: ", newMap);
    await ddcsControllers.loadMission(newMap);
     */
}

export function secondsToHms(d: number): string {
    const hLeft = d / 3600000;
    const h = Math.floor(hLeft);
    const m = Math.floor(60 * (hLeft - h));
    // const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes") : "";
    // const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay;
}

export async function timeLeft(curUnit: typings.IUnit): Promise<void> {
    const formatTime = secondsToHms(getMaxTime() - getCurSeconds());

    console.log("G: Server has " + formatTime + " left till restart!");
    await ddcsControllers.sendMesgToGroup(
        curUnit.groupId,
        "G: Server has " + formatTime + " left till restart!",
        5
    );
}
