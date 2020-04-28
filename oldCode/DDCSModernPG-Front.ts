/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../src/controllers";

// config
// const masterServer = "127.0.0.1";
const serverName = "DDCSModernPG";

export let curAbsTime: number;
export let realServerSecs: number;
export let startAbsTime: number;
export let curServerUnitCnt: number;

export let sessionName: string;
export let ddcsSocket: any;

// await ddcsController.initDB(serverName, masterServer);
// await ddcsController.initServer();

setInterval( async () => {
    if (ddcsSocket) {
        if (ddcsSocket.connOpen) {
            console.log("Connecting to " + serverName + " Frontend");
            sessionName = "";
            ddcsController.setSyncLockdownMode(false);
            await ddcsController.cmdQueActionsRemoveAll();
            await ddcsSocket.connSocket();
        }
    } else {
         await ddcsController.createSocket(
            "localhost",
            Number(ddcsController.config.dcsClientPort),
            "clientArray",
            socketCallback,
            "frontend"
        );
    }
}, 3 * ddcsController.time.sec);

export async function getLatestSession(serverEpoc: number, startAbs: number, curAbs: number): Promise<void> {
    if (serverEpoc) {
        const buildSessionName = serverName + "_" + serverEpoc;
        const newSession = {
            _id: buildSessionName,
            name: buildSessionName,
            startAbsTime: startAbs,
            curAbsTime: curAbs,
            campaignName: ""
        };
        const latestSession = await ddcsController.sessionsActionsReadLatest();
        console.log(
            "create new session: ",
            sessionName,
            " !== ",
            latestSession[0].name,
            " || ",
            curAbsTime,
            " > ",
            curAbs
        );
        if (sessionName !== latestSession[0].name || curAbsTime > curAbs) {
            await ddcsController.resetMinutesPlayed();
            const campaign = await ddcsController.campaignsActionsReadLatest();
            if (campaign) {
                newSession.campaignName =  campaign[0].name;
                await ddcsController.sessionsActionsUpdate(newSession);
                console.log("SESSNAME: ", newSession, buildSessionName);
                sessionName = buildSessionName;
            }
        } else {
            console.log("use existing session: ", sessionName);
            await ddcsController.sessionsActionsUpdate(newSession);
            sessionName = buildSessionName;
        }
    }
}

export async function socketCallback(cbArray: ddcsController.ISrvMessages): Promise<void> {
    curAbsTime = cbArray.curAbsTime;
    realServerSecs = cbArray.curAbsTime - cbArray.startAbsTime;
    startAbsTime = cbArray.startAbsTime;
    curServerUnitCnt = cbArray.unitCount;

    if (!ddcsController.isServerSynced) {
        console.log("SYNC: ", ddcsController.isServerSynced);
    }

    if (!sessionName) {
        console.log("getLatestSession: ");
        await getLatestSession(cbArray.epoc, cbArray.startAbsTime,  cbArray.curAbsTime);
    } else {
        for (const queObj of cbArray.que) {
            switch (queObj.action) {
                case "C" || "U" || "D":
                    await ddcsController.processUnitUpdates(sessionName, queObj);
                    break;
                case  "airbaseC" || "airbaseU":
                    await ddcsController.processAirbaseUpdates(serverName, queObj);
                    break;
                case "f10Menu" && ddcsController.isServerSynced:
                    await ddcsController.menuCmdProcess(sessionName, queObj);
                    break;
                case "S_EVENT_HIT" && ddcsController.isServerSynced:
                    await ddcsController.processEventHit(sessionName, queObj);
                    break;
                case "S_EVENT_TAKEOFF" && ddcsController.isServerSynced:
                    await ddcsController.processEventTakeoff(sessionName, queObj);
                    break;
                case "S_EVENT_LAND" && ddcsController.isServerSynced:
                    await ddcsController.processEventLand(sessionName, queObj);
                    break;
                case "S_EVENT_EJECTION" && ddcsController.isServerSynced:
                    await ddcsController.processEventEjection(sessionName, queObj);
                    break;
                case "S_EVENT_CRASH" && ddcsController.isServerSynced:
                    await ddcsController.processEventCrash(sessionName, queObj);
                    break;
                case "S_EVENT_DEAD" && ddcsController.isServerSynced:
                    await ddcsController.processEventDead(sessionName, queObj);
                    break;
                case "S_EVENT_PILOT_DEAD" && ddcsController.isServerSynced:
                    await ddcsController.processEventPilotDead(sessionName, queObj);
                    break;
                case "S_EVENT_REFUELING" && ddcsController.isServerSynced:
                    await ddcsController.processEventRefueling(sessionName, queObj);
                    break;
                case "S_EVENT_REFUELING_STOP" && ddcsController.isServerSynced:
                    await ddcsController.processEventRefuelingStop(sessionName, queObj);
                    break;
                case "S_EVENT_BIRTH" && ddcsController.isServerSynced:
                    await ddcsController.processEventBirth(sessionName, queObj);
                    break;
                case "S_EVENT_PLAYER_ENTER_UNIT" && ddcsController.isServerSynced:
                    await ddcsController.processEventPlayerEnterUnit(sessionName, queObj);
                    break;
                case "S_EVENT_PLAYER_LEAVE_UNIT" && ddcsController.isServerSynced:
                    await ddcsController.processEventPlayerLeaveUnit(sessionName, queObj);
                    break;
                case "LOSVISIBLEUNITS" && ddcsController.isServerSynced:
                    await ddcsController.processLOSEnemy(queObj);
                    break;
                case "CRATEOBJUPDATE" && ddcsController.isServerSynced:
                    await ddcsController.processStaticCrate(queObj);
                    break;
                case "unitsAlive" && ddcsController.isServerSynced:
                    await ddcsController.sendMissingUnits(queObj.data);
                    break;
            }
        }
    }
}

setInterval( async () => {
    if (!exports.DCSSocket.connOpen) {
        await ddcsController.processOneSecActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.sec);

setInterval( async () => {
    if (!exports.DCSSocket.connOpen) {
        await ddcsController.processFiveSecActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.fiveSecs);

setInterval( async () => {
    if (!exports.DCSSocket.connOpen) {
        await ddcsController.processThirtySecActions(ddcsController.isServerSynced);
        await ddcsController.processTimer(realServerSecs);
    } else {
        ddcsController.resetTimerObj();
    }
}, ddcsController.time.thirtySecs);

setInterval( async () => {
    if (sessionName) {
        await ddcsController.sessionsActionsUpdate({
            _id: sessionName,
            name: sessionName,
            startAbsTime,
            curAbsTime
        });
    }
}, ddcsController.time.oneMin);

setInterval( async () => {
    if (!ddcsSocket.connOpen) {
        ddcsController.processFiveMinuteActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.fiveMins);

setInterval( async () => {
    if (!ddcsSocket.connOpen) {
        ddcsController.processTenMinuteActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.tenMinutes);

setInterval( async () => {
    if (!ddcsSocket.connOpen) {
        ddcsController.processThirtyMinuteActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.thirtyMinutes);

setInterval( async () => {
    if (!ddcsSocket.connOpen) {
        ddcsController.processOneHourActions(ddcsController.isServerSynced);
    }
}, ddcsController.time.oneHour);

setInterval( async () => {
    if (ddcsController.bases && !ddcsSocket.connOpen) {
        await ddcsController.syncType(curServerUnitCnt);
    }
}, ddcsController.time.sec);
