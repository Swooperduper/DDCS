/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

let curSecs = 0;
let curTime = new Date().getTime();
let lastSentLoader = _.cloneDeep(curTime);
let maxTime = 0;
let mesg;

export let timerObj = {};

export async function processTimer(serverSecs: number): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    maxTime = engineCache.config.restartTimer;
    mesg = null;
    curSecs = serverSecs;

    if (maxTime > 0) {
        if (serverSecs > (maxTime - (ddcsControllers.time.oneHour * 4)) && !exports.timerObj.fourHours) {
            mesg = "Server is restarting in 4 hours!";
            exports.timerObj.fourHours = true;
        }
        // 3 hours
        if (serverSecs > (maxTime - (ddcsControllers.time.oneHour * 3)) && !exports.timerObj.threeHours) {
            mesg = "Server is restarting in 3 hours!";
            exports.timerObj.threeHours = true;
        }
        // 2 hours
        if (serverSecs > (maxTime - (ddcsControllers.time.oneHour * 2)) && !exports.timerObj.twoHours) {
            mesg = "Server is restarting in 2 hours!";
            exports.timerObj.twoHours = true;
        }
        // 1 hour
        if (serverSecs > (maxTime - ddcsControllers.time.oneHour) && !exports.timerObj.oneHour) {
            mesg = "Server is restarting in 1 hour!";
            exports.timerObj.oneHour = true;
        }
        // 30 mins
        if (serverSecs > (maxTime - 1800) && !exports.timerObj.thirtyMinutes) {
            mesg = "Server is restarting in 30 minutes!";
            exports.timerObj.thirtyMinutes = true;
        }
        // 20 mins
        if (serverSecs > (maxTime - 1440) && !exports.timerObj.twentyMinutes) {
            mesg = "Server is restarting in 20 mins!";
            exports.timerObj.twentyMinutes = true;
        }
        // 10 mins
        if (serverSecs > (maxTime - 720) && !exports.timerObj.tenMinutes) {
            mesg = "Server is restarting in 10 mins!";
            exports.timerObj.tenMinutes = true;
        }
        // 5 mins
        if (serverSecs > (maxTime - 360) && !exports.timerObj.fiveMinutes) {
            mesg = "Server is restarting in 5 minutes!";
            exports.timerObj.fiveMinutes = true;
        }
        // 4 mins
        if (serverSecs > (maxTime - 240) && !exports.timerObj.fourMinutes) {
            mesg = "Server is restarting in 4 minutes!";
            exports.timerObj.fourMinutes = true;
        }
        // 3 mins
        if (serverSecs > (maxTime - 180) && !exports.timerObj.threeMinutes) {
            mesg = "Server is restarting in 3 minutes!";
            exports.timerObj.threeMinutes = true;
        }
        // 2 mins
        if (serverSecs > (maxTime - 120) && !exports.timerObj.twoMinutes) {
            mesg = "Server is restarting in 2 minutes, Locking Server Down!";
            exports.timerObj.twoMinutes = true;
            await ddcsControllers.setIsOpenSlotFlag(0);
        }
        // 1 min
        if (serverSecs > (maxTime - 60) && !exports.timerObj.oneMinute) {
            mesg = "Server is restarting in 1 minute, Server Is Locked!";
            exports.timerObj.oneMinute = true;
            await ddcsControllers.setIsOpenSlotFlag(0);
            const latestSession = await ddcsControllers.sessionsActionsReadLatest();
            if (latestSession.name) {
                const playerArray = await ddcsControllers.srvPlayerActionsRead({ sessionName: latestSession.name });
                for (const player of playerArray) {
                    await ddcsControllers.kickPlayer(Number(player.playerId), "Server is now restarting!");
                }
            }
        }
        // restart server
        if (serverSecs > maxTime) {
            // restart server on next or same map depending on rotation
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
            }
        } else {
            if (mesg) {
                console.log("serverMesg: ", mesg);
                await ddcsControllers.sendMesgToAll(mesg, 20);
            }
        }
    }
}

export function resetTimerObj(): void {
    timerObj = {};
}

export async function restartServer(): Promise<void> {
    const server = await ddcsControllers.serverActionsRead({});
    const newMap = server[0].curFilePath + "_" + server[0].curSeason + "_" +
        _.random(1, (server[0].mapCount || 1)) + ".miz";
    console.log("Loading Map: ", newMap);
    await ddcsControllers.loadMission(newMap);
}

export function secondsToHms(d: number): string {
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    // const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes") : "";
    // const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay;
}

export async function timeLeft(curUnit: typings.IUnit): Promise<void> {
    const formatTime = exports.secondsToHms(maxTime - curSecs);
    await ddcsControllers.sendMesgToGroup(
        curUnit.groupId,
        "G: Server has " + formatTime + " left till restart!",
        5
    );
}
