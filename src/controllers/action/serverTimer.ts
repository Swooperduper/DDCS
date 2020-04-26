/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

let curSecs = 0;
let curTime = new Date().getTime();
let lastSentLoader = _.cloneDeep(curTime);
let maxTime = 0;
let mesg;
const oneHour = _.get(ddcsController, "time.oneHour");

exports.timerObj = {};

export function processTimer(serverSecs: number) {
    maxTime = ddcsController.config.restartTime;
    mesg = null;
    curSecs = serverSecs;

    if (maxTime > 0) {
        if (serverSecs > (maxTime - (oneHour * 4)) && !exports.timerObj.fourHours) {
            mesg = "Server is restarting in 4 hours!";
            exports.timerObj.fourHours = true;
        }
        // 3 hours
        if (serverSecs > (maxTime - (oneHour * 3)) && !exports.timerObj.threeHours) {
            mesg = "Server is restarting in 3 hours!";
            exports.timerObj.threeHours = true;
        }
        // 2 hours
        if (serverSecs > (maxTime - (oneHour * 2)) && !exports.timerObj.twoHours) {
            mesg = "Server is restarting in 2 hours!";
            exports.timerObj.twoHours = true;
        }
        // 1 hour
        if (serverSecs > (maxTime - oneHour) && !exports.timerObj.oneHour) {
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
            ddcsController.setIsOpenSlotFlag(0)
                .catch((err) => {
                    console.log("line80: ", err);
                });
        }
        // 1 min
        if (serverSecs > (maxTime - 60) && !exports.timerObj.oneMinute) {
            mesg = "Server is restarting in 1 minute, Server Is Locked!";
            exports.timerObj.oneMinute = true;
            ddcsController.setIsOpenSlotFlag(0)
                .catch((err) => {
                    console.log("line89: ", err);
                });
            ddcsController.sessionsActionsReadLatest()
                .then((latestSession: any) => {
                    if (latestSession.name) {
                        ddcsController.srvPlayerActionsRead({ sessionName: latestSession.name })
                            .then((playerArray: any) => {
                                _.forEach(playerArray, (player) => {
                                    ddcsController.kickPlayer(player.id, "Server is now restarting!")
                                        .catch((err) => {
                                            console.log("line99: ", err);
                                        });
                                });
                            })
                            .catch((err) => {
                                console.log("line101: ", err);
                            })
                        ;
                    }
                })
                .catch((err) => {
                    console.log("line107: ", err);
                })
            ;
        }
        // restart server
        if (serverSecs > maxTime) {
            // restart server on next or same map depending on rotation
            curTime = new Date().getTime();
            if (curTime > lastSentLoader + ddcsController.time.oneMin) {
                ddcsController.sessionsActionsReadLatest()
                    .then((latestSession: any) => {
                        if (latestSession.name) {
                            ddcsController.srvPlayerActionsRead({ sessionName: latestSession.name })
                                .then((playerArray: any) => {
                                    _.forEach(playerArray, (player) => {
                                        ddcsController.kickPlayer(player.id, "Server is now restarting!")
                                            .catch((err) => {
                                                console.log("line127: ", err);
                                            });
                                    });
                                    exports.restartServer();
                                })
                                .catch((err) => {
                                    console.log("line101: ", err);
                                });
                        }
                    })
                    .catch((err) => {
                        console.log("line107: ", err);
                    });
                lastSentLoader = curTime;
            }
        } else {
            if (mesg) {
                console.log("serverMesg: ", mesg);
                ddcsController.sendMesgToAll(mesg, 20)
                    .catch((err) => {
                        console.log("line135: ", err);
                    });
            }
        }
    }
}

export function resetTimerObj() {
    exports.timerObj = {};
}

export async function restartServer() {
    ddcsController.serverActionsRead({})
        .then((server: any) => {
            const newMap = server[0].curFilePath + "_" + server[0].curSeason + "_" +
                _.random(1, (server[0].mapCount || 1)) + ".miz";

            console.log("Loading Map: ", newMap);
            ddcsController.loadMission(newMap);
        })
        .catch((err) => {
            console.log("line73: ", err);
        });
}

export function secondsToHms(d: number) {
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    // const s = Math.floor(d % 3600 % 60);

    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes") : "";
    // const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    return hDisplay + mDisplay;
}

export async function timeLeft(curUnit: any) {
    const formatTime = exports.secondsToHms(maxTime - curSecs);
    return ddcsController.sendMesgToGroup(
        curUnit.groupId,
        "G: Server has " + formatTime + " left till restart!",
        5
    );
}
