/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";
import { getSessionName } from "../";

const requestJobArray: any[] = [];

let missionStartupReSync = true;
let isServerSynced = false;
let isInitSyncMode = false; // Init Sync Units To Server Mode
let nextUniqueId = 1;
let resetFullCampaign = false;

export function getResetFullCampaign(): boolean {
    return resetFullCampaign;
}

export async function setResetFullCampaign(value: boolean): Promise<void> {
    await ddcsControllers.serverActionsUpdate({name: process.env.SERVER_NAME, resetFullCampaign: value});
    resetFullCampaign = value;
}

export function getMissionStartupReSync(): boolean {
    return missionStartupReSync;
}

export function setMissionStartupReSync(value: boolean): void {
    missionStartupReSync = value;
}

export function getRequestIndex(reqId: number): any {
    return _.findIndex(requestJobArray, ["reqId", reqId]);
}

export function getRequestJob(reqId: number): any {
    return requestJobArray.find((r) => r.reqId === reqId);
}

export function getNextUniqueId(): number {
    const curUniqueId = nextUniqueId;
    nextUniqueId += 1;
    return curUniqueId;
}

export function getServerSynced(): boolean {
    return isServerSynced;
}

export function setServerSynced(value: boolean): void {
    isServerSynced = value;
}

export function setSyncLockdownMode(flag: boolean): void {
    isInitSyncMode = flag;
}

export async function reSyncAllUnitsFromDbToServer(): Promise<void> {
    console.log("Respawn Current Units From Db ", missionStartupReSync);
    // sync up all units on server from database
    const unitObjs = await ddcsControllers.unitActionReadStd({
        dead: false,
        isActive: true,
        _id: {$not: /~/},
        isResync: false
    });

    if (unitObjs.length > 0) {
        const remappedObjs: any = {};
        for (const unitObj of unitObjs) {
            unitObj.lateActivation = true;
            if (ddcsControllers.UNIT_CATEGORY[unitObj.unitCategory] === "GROUND_UNIT" && !unitObj.isTroop) {
                const curName = unitObj.groupName;
                remappedObjs[curName] = remappedObjs[curName] || [];
                remappedObjs[curName].push(unitObj);
            } else if (ddcsControllers.UNIT_CATEGORY[unitObj.unitCategory] === "STRUCTURE" && !unitObj.isTroop) {
                await ddcsControllers.spawnStaticBuilding(unitObj, false);
            } else {
                await ddcsControllers.unitActionUpdate({
                    _id: unitObj.name,
                    dead: true
                });
            }
        }

        for (const [key, value] of Object.entries(remappedObjs)) {
            await ddcsControllers.spawnUnitGroup(value as any[], false);
        }
    } else {
        console.log("ReSync Que Complete");
    }
}

export async function populateNewCampaignUnits(): Promise<void> {
    // clear unit DB from all non ~ units, respawn fresh server
    missionStartupReSync = true;
    console.log("Spawn New Objs for Campaign: ", missionStartupReSync);
    console.log("Clear Units");
    await ddcsControllers.unitActionRemoveall(); // clear unit table
    console.log("Generate Units For Database");
    await ddcsControllers.spawnNewMapObjs(); // respond with server spawned num
}

export async function syncByName(incomingObj: any, curReqJobIndex: number): Promise<void> {
    const curReqJob = requestJobArray[curReqJobIndex];
    console.log("server: ", curReqJob.reqArgs.serverCount, "db: ", curReqJob.reqArgs.dbCount);

    const aliveNamesObj =
        await ddcsControllers.actionAliveNames({dead: false});
    const aliveNameArray = aliveNamesObj.map((u: any) => u._id);

    if (curReqJob.reqArgs.serverCount > curReqJob.reqArgs.dbCount) {
        const missingNames = _.difference(incomingObj.returnObj, aliveNameArray);
        console.log("Db is missing ", missingNames, " unit(s)");
        if (missingNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncInfo",
                    objType: (ddcsControllers.UNIT_CATEGORY[incomingObj.category] === "STRUCTURE") ? "static" : "unit",
                    missingNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }

    if (curReqJob.reqArgs.serverCount < curReqJob.reqArgs.dbCount) {
        console.log("server: ", curReqJob.reqArgs.serverCount, "db: ", curReqJob.reqArgs.dbCount);
        console.log("Server Has Active Objs");
        const missingNames = _.difference(aliveNameArray, incomingObj.returnObj);
        console.log("Server is missing ", missingNames, " obj(s)");
        if (missingNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncInfo",
                    objType: (ddcsControllers.UNIT_CATEGORY[incomingObj.category] === "STRUCTURE") ? "static" : "unit",
                    missingNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }
    requestJobArray.splice(curReqJobIndex, 1);
}

export async function reSyncServerObjs(serverCount: number, dbCount: number) {
    const curNextUniqueId = getNextUniqueId();
    requestJobArray.push({
        reqId: curNextUniqueId,
        callBack: "syncByName",
        reqArgs: {
            serverCount,
            dbCount
        }
    });
    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "getNames",
            reqID: curNextUniqueId,
            time: new Date()
        }
    });
}

export async function activateInitSpawn() {
    await ddcsControllers.unitActionChkResync();
    // loop through and activate all non ~
    const unitObjs = await ddcsControllers.unitActionReadStd({
        dead: false,
        isActive: false,
        _id: {$not: /~/},
        isResync: false
    });

    const unitGroups = _.groupBy(unitObjs, (u) => u.groupName);

    if (Object.keys(unitGroups).length > 0) {
        console.log("Start Activating all units");
        for (const unitKeys of Object.keys(unitGroups)) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: "Group.getByName(\"" + unitKeys + "\"):activate()",
                    reqID: 0,
                    time: new Date()
                }
            });
        }
        console.log("Finished Activating all units");
    }
}

export async function syncCheck(serverCount: number): Promise<void> {
    if (getSessionName()) {
        const servers = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers && servers[0]) {
            // is missing empty, pull all units that are active and dont have ~ in unit/static name
            const preBakedNames = await ddcsControllers.actionAliveNames({
                dead: false,
                $or: [{isActive: false}, {_id: /~/}]
            });
            const isServerVirgin = serverCount <= preBakedNames.length; // keep an eye on this one....
            if (isServerVirgin || getMissionStartupReSync() || getResetFullCampaign()) {
                if (isServerVirgin || getResetFullCampaign()) {
                    setServerSynced(false);
                    console.log("Server is VIRGIN");
                    const getConfig = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
                    ddcsControllers.setConfig(getConfig[0]);
                    await setResetFullCampaign(ddcsControllers.getEngineCache().config.resetFullCampaign);
                    setMissionStartupReSync(true);
                    await ddcsControllers.unitActionChkResync();
                    console.log("ResetCampaign: ", getResetFullCampaign(), "MissionReSync: ", missionStartupReSync);
                    if (getResetFullCampaign()) {
                        await setResetFullCampaign(false); // UNDO
                        console.log("Server is new campaign");
                        // new campaign spawn
                        await populateNewCampaignUnits();
                    }
                }
                const dbCount = await ddcsControllers.actionCount({dead: false});
                console.log("NORM SYNC: ", serverCount, dbCount);
                if (serverCount < dbCount) {
                    await reSyncAllUnitsFromDbToServer();
                } else if (serverCount > dbCount) {
                    await reSyncServerObjs(serverCount, dbCount);
                } else {
                    // unlock server port
                    // send message to discord
                    await activateInitSpawn();
                    setMissionStartupReSync(false);
                    setServerSynced(true);
                    console.log("Server Is Synchronized");
                }
            } else {
                // normal named sync system
                const dbCount = await ddcsControllers.actionCount({dead: false});
                console.log("Server:", serverCount, " Db", dbCount);
                if (serverCount !== dbCount) {
                    await reSyncServerObjs(serverCount, dbCount);
                } else {
                    // normal synced operation
                    console.log("NORMAL SYNC CHECK LOOP");
                }
            }
        }
    }
}
