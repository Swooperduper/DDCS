/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";
import { getSessionName } from "../";

const requestJobArray: any[] = [];

let missionStartupReSync = false;
let isServerSynced = true;
let isInitSyncMode = false; // Init Sync Units To Server Mode
let isReSyncLock = false;
let nextUniqueId = 1;

export function getMissionStartupReSync(): boolean {
    return missionStartupReSync;
}

export function setMissionStartupReSync(value: boolean): void {
    missionStartupReSync = value;
}

export function getRequestIndex(reqId: number) {
    return _.findIndex(requestJobArray, ["reqId", reqId]);
}

export function getRequestJob(reqId: number) {
    return requestJobArray.find((r) => r.reqId === reqId);
}

export function getNextUniqueId() {
    const curUniqueId = nextUniqueId;
    nextUniqueId += 1;
    return curUniqueId;
}

export function getServerSynced() {
    return isServerSynced;
}

export function setServerSynced(value: boolean) {
    isServerSynced = value;
}

export function setReSyncLock(value: boolean) {
    isReSyncLock = value;
}

export function setSyncLockdownMode(flag: boolean) {
    isInitSyncMode = flag;
}

/*
export async function OldBrokenSyncServer(serverUnitCount: number): Promise<void> {
    const remappedunits: any = {};
    const units = await ddcsControllers.unitActionReadStd({dead: false});
    if (serverUnitCount === 0) { // server is empty
        ddcsControllers.resetEWRUnitsActivated();
        isServerSynced = false;
        isServerFresh = true;
        if (!isSyncLockdownMode) {
            ddcsControllers.resetTimerObj();
            isSyncLockdownMode = true; // lock down all traffic until sync is complete
            if (units.length === 0) { // DB is empty
                console.log("DB & Server is empty of Units, Spawn New Units");
                masterUnitCount = await ddcsControllers.spawnNewMapGrps(); // respond with server spawned num
                processInstructions = true;
                console.log("processed Instructons 1: ", processInstructions);
            } else { // DB is FULL
                console.log("DB has " + units.length + " Units, Respawn Them");
                const filterStructure = _.filter(units, {category: "STRUCTURE"});
                const filterGround = _.filter(units, {category: "GROUND"});
                // const filterShips = _.filter(units, {category: "SHIP"});
                masterUnitCount = filterStructure.length + filterGround.length;
                if (units.length > 0) {
                    for (const unit of units) {
                        const curGrpName = unit.groupName;
                        if (unit.category === "GROUND" && !unit.isTroop && !unit.isAI) {
                            remappedunits[curGrpName] = remappedunits[curGrpName] || [];
                            remappedunits[curGrpName].push(unit);
                        } else if (unit.type === ".Command Center") {
                            await ddcsControllers.spawnLogisticCmdCenter(unit, true);
                        } else if (unit.type === "Comms tower M") {
                            await ddcsControllers.spawnRadioTower(unit, true);
                        } else {
                            await ddcsControllers.unitActionUpdate({
                                _id: unit.name,
                                name: unit.name,
                                dead: true
                            });
                        }
                    }

                    if ( remappedunits.length > 0 ) {
                        for (const group of remappedunits) {
                            await ddcsControllers.spawnUnitGroup(group);
                        }
                    }

                    const staticCrates = await ddcsControllers.staticCrateActionRead({});
                    if ( staticCrates.length > 0 ) {
                        for (const crateObj of staticCrates) {
                            await ddcsControllers.spawnLogiCrate(crateObj);
                        }
                    }
                }
            }
            processInstructions = true;
            console.log("processed Instructons 2: ", processInstructions);
        } else {
            console.log("syncro mode is on lockdown: ", isSyncLockdownMode);
        }
    } else {
        if (isServerFresh) { // server is fresh
            ddcsControllers.resetEWRUnitsActivated();
            if (processInstructions) {
                if (serverUnitCount !== units.length) {
                    if (lastUnitCount === serverUnitCount) {
                        if (stuckDetect > 5) {
                            mesg = "STUCK|" + stuckDetect + "|F|" + units.length + ":" + serverUnitCount + ":" +
                                isServerSynced + ":" + isSyncLockdownMode;
                        } else {
                            mesg = "SYNCING|F|" + units.length + ":" + serverUnitCount;
                        }
                        if (stuckDetect > stuckThreshold) {
                            await ddcsControllers.sendUDPPacket("frontEnd", {
                                queName: "clientArray",
                                actionObj: {action: "GETUNITSALIVE"}
                            });
                            stuckDetect = 0;
                        } else {
                            stuckDetect++;
                        }
                    } else {
                        stuckDetect = 0;
                        lastUnitCount = serverUnitCount;
                        mesg = "SYNCING|F|" + units.length + ":" + serverUnitCount;
                    }
                    console.log(mesg);
                    await ddcsControllers.sendMesgChatWindow(mesg);
                    isServerSynced = false;
                } else {
                    if (!isServerSynced && units.length > 50) {
                        mesg = "Server units are Synced, Slots Now Open!";
                        console.log(mesg);
                        await ddcsControllers.sendMesgChatWindow(mesg);
                        isServerSynced = true;
                        isServerFresh = false;
                        await ddcsControllers.setIsOpenSlotFlag(1);
                        await ddcsControllers.setSideLockFlags();
                        await ddcsControllers.setbaseSides();
                        await ddcsControllers.setFarpMarks();
                    } else {
                        console.log("failing  !exports.isServerSynced && units.length > 50",
                            !isServerSynced, " && ", units.length > 100);
                    }
                }
            } else {
                console.log("No Sync Instructions to be processed", processInstructions);
            }
        } else { // server has units on it
            if (units.length !== serverUnitCount) { // db doesnt match server
                if (lastUnitCount === serverUnitCount) {
                    if (stuckDetect > 5) {
                        mesg = "STUCK|" + stuckDetect + "|R1|" + units.length + ":" + serverUnitCount + ":" +
                            isServerSynced + ":" + isSyncLockdownMode;
                    } else {
                        mesg = "SYNCING|R1|" + units.length + ":" + serverUnitCount;
                    }
                    if (stuckDetect > stuckThreshold) {
                        await ddcsControllers.sendUDPPacket("frontEnd", {
                            queName: "clientArray",
                            actionObj: {action: "GETUNITSALIVE"}
                        });
                        stuckDetect = 0;
                    } else {
                        stuckDetect++;
                    }
                } else {
                    stuckDetect = 0;
                    lastUnitCount = serverUnitCount;
                    mesg = "SYNCING|R2|" + units.length + ":" + serverUnitCount;
                }
                isServerSynced = true;
                console.log(mesg);
            } else {
                if (!isServerSynced && units.length > 50) {
                    mesg = "Server units Synced";
                    console.log(mesg);
                    // DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
                    exports.isServerSynced = true;
                    await ddcsControllers.setIsOpenSlotFlag(1);
                    await ddcsControllers.setbaseSides();
                    await ddcsControllers.setFarpMarks();
                }
            }
        }
    }
}
*/

export async function syncByName(incomingObj: any, curReqJobIndex: number): Promise<void> {
    const curReqJob = requestJobArray[curReqJobIndex];
    console.log("server: ", curReqJob.reqArgs.serverCount, " > ", "db: ", curReqJob.reqArgs.dbCount);
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
        // is missing empty, pull all units that are active and dont have ~ in unit/static name
        const preBakedNames = await ddcsControllers.actionAliveNames({
            dead: false,
            $or: [{isActive: false}, {_id: /~/}]
        });
        console.log("Units server: ", curReqJob.reqArgs.serverCount, "bakedUnits: ", preBakedNames.length);
        if ((curReqJob.reqArgs.serverCount - preBakedNames.length) === 0) {
            console.log("Server is VIRGIN");
            missionStartupReSync = true;
            if (ddcsControllers.getEngineCache().config.resetFullCampaign) {
                // clear unit DB from all non ~ units, respawn fresh server
                console.log("Spawn New Objs for Campaign: ", missionStartupReSync);

            } else {
                console.log("Respawn Current Units From Db ", missionStartupReSync);
                // sync up all units on server from database
                const unitObjs = await ddcsControllers.unitActionReadStd({
                    dead: false,
                    isActive: true,
                    _id: {$not: /~/}
                });

                if (unitObjs.length > 0) {
                    const remappedObjs: any = {};
                    for (const unitObj of unitObjs) {
                        if (ddcsControllers.UNIT_CATEGORY[unitObj.category] === "GROUND_UNIT" && !unitObj.isTroop) {
                            const curName = unitObj.groupName;
                            remappedObjs[curName] = remappedObjs[curName] || [];
                            remappedObjs[curName].push(unitObj);
                        } else if (ddcsControllers.UNIT_CATEGORY[unitObj.category] === "STRUCTURE" && !unitObj.isTroop) {
                            await ddcsControllers.spawnStaticBuilding((unitObj));
                        } else {
                            await ddcsControllers.unitActionUpdate({
                                _id: unitObj.name,
                                dead: true
                            });
                        }
                    }

                    for (const [key, value] of Object.entries(remappedObjs)) {
                        await ddcsControllers.spawnUnitGroup(value as any[]);
                    }
                }
            }
        } else {
            if (!missionStartupReSync) {
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
            } else {
                // when server units are fully sync, unlock missing unit names
                console.log("STILL SYNC OBJS");
            }
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

export async function syncCheck(serverCount: number): Promise<void> {
    if (getSessionName()) {
        const servers = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers && servers[0]) {
            const dbCount = await ddcsControllers.actionCount({dead: false});
            if ( serverCount !== dbCount) {
                await reSyncServerObjs(serverCount, dbCount);
            } else {
                if (getMissionStartupReSync()) {
                    // server is synced opening up mission
                    // sync base captures
                    // unlock join ports
                    // make announcement to discord

                    ddcsControllers.setMissionStartupReSync(false);
                    console.log("Server Is Synced");
                } else {
                    // loop hits in normal operation
                }
            }
        }
    }
}

const arrayThing = [
  "a",
  "b"
];

for (let i = 0; i < arrayThing.length; i++) {
    console.log("Each element: ", arrayThing[i]);
}
