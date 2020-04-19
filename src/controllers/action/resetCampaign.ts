/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// tslint:disable-next-line:no-var-requires
const exec = require("child_process").exec;

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db";
import * as serverTimerController from "../action/serverTimer";

exports.timeToRestart = 0;

// Create shutdown function
function shutdown(callback: { (output: any): void; (arg0: any): any; }) {
    exec("shutdown.exe /r /t 00", (error: any, stdout: any) => callback(stdout) );
}

export function checkTimeToRestart() {
    if (exports.timeToRestart !== 0) {
        if (new Date().getTime() > exports.timeToRestart) {
            exports.restartServer();
        }
    }
}

export async function clearCampaignTables() {
    console.log("clearTables");
    const groupPromise: any[] = [];
    groupPromise.push(masterDBController.cmdQueActionsRemoveAll()
        .catch((err: any) => {
            console.log("line 32: ", err);
        }))
    ;
    groupPromise.push(masterDBController.staticCrateActionRemoveall()
        .catch((err: any) => {
            console.log("line 37: ", err);
        }))
    ;
    groupPromise.push(masterDBController.unitActionRemoveall()
        .catch((err: any) => {
            console.log("line 42: ", err);
        }))
    ;
    return Promise.all(groupPromise)
        .catch((err: any) => {
            console.log("line 50: ", err);
        });
}

export function restartServer() {
    console.log("ALL TABLES CLEARED OFF, restart");
    if (_.get(constants, "config.fullServerRestartOnCampaignWin", false)) {
        shutdown((output: any) => {
            console.log(output);
        });
    } else {
        serverTimerController.restartServer()
            .catch((err) => {
                console.log("line61: ", err);
            });
    }
}
