/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";
import { getSessionName } from "../";

const requestJobArray: any[] = [];

let missionStartupUnitsReSync = false;
let missionStartupStaticsReSync = false;
let isServerSynced = true;
let isInitSyncMode = false; // Init Sync Units To Server Mode
let isReSyncLock = false;
let nextUniqueId = 1;

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

export async function syncStaticsNames(incomingObj: any, curReqJobIndex: number): Promise<void> {
    const curReqJob = requestJobArray[curReqJobIndex];
    const aliveStaticNamesObj =
        await ddcsControllers.actionAliveNames({dead: false, category: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE")});
    const aliveStaticNameArray = aliveStaticNamesObj.map((u: any) => u._id);
    if (curReqJob.reqArgs.serverStaticCount > curReqJob.reqArgs.dbStaticCount) {
        const missingStaticNames = _.difference(incomingObj.returnObj, aliveStaticNameArray);
        console.log("Server is missing ", missingStaticNames, " static(s)");
        if (missingStaticNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncStaticInfo",
                    missingStaticNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }

    if (curReqJob.reqArgs.serverStaticCount < curReqJob.reqArgs.dbStaticCount) {
        // is missing empty, pull all units that are active and dont have ~ in unit/static name
        const nonPreBakedNames = await ddcsControllers.actionAliveNames({
            dead: false,
            category: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE"),
            $or: [{isActive: false}, {_id: /~/}]
        });
        console.log("Statics server: ", curReqJob.reqArgs.serverStaticCount, "bakedUnits: ", nonPreBakedNames.length);
        if ((curReqJob.reqArgs.serverStaticCount - nonPreBakedNames.length) === 0) {
            missionStartupStaticsReSync = true;
            console.log("MISSION IS EMPTY, respawn statics from DB", missionStartupUnitsReSync);
            // sync up all statics on server from database
            const statics = await ddcsControllers.unitActionReadStd({
                dead: false,
                isActive: true,
                _id: {$not: /~/},
                category: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE")
            });
            if (statics.length > 0) {
                for (const curStatic of statics) {
                    if (ddcsControllers.UNIT_CATEGORY[curStatic.category] === "STRUCTURE") {
                        await ddcsControllers.spawnStaticBuilding(curStatic);
                    } else {
                        await ddcsControllers.unitActionUpdate({
                            _id: curStatic.name,
                            dead: true
                        });
                    }
                }
            }
        } else {
            if (!missionStartupStaticsReSync) {
                console.log("MISSION IS NOT EMPTY, Sync Server -> Db (mark db statics not on server as dead)");
                const missingStaticNames = _.difference(aliveStaticNameArray, incomingObj.returnObj);
                console.log("Db is missing ", missingStaticNames, " static(s)");
                if (missingStaticNames.length > 0) {
                    await ddcsControllers.sendUDPPacket("frontEnd", {
                        actionObj: {
                            action: "reSyncStaticInfo",
                            missingStaticNames,
                            reqID: 0, // dont run anything with return data
                            time: new Date()
                        }
                    });
                }
            } else {
                // when server statics are fully sync, unlock missing static names
                console.log("STILL SYNC STATICS");
            }
        }
    }
    requestJobArray.splice(curReqJobIndex, 1);
}

export async function syncUnitsNames(incomingObj: any, curReqJobIndex: number): Promise<void> {
    const curReqJob = requestJobArray[curReqJobIndex];
    console.log("server: ", curReqJob.reqArgs.serverUnitCount, " > ", "db: ", curReqJob.reqArgs.dbUnitCount);
    const aliveUnitNamesObj =
        await ddcsControllers.actionAliveNames({dead: false, category: { $ne: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE")}});
    const aliveUnitNameArray = aliveUnitNamesObj.map((u: any) => u._id);

    if (curReqJob.reqArgs.serverUnitCount > curReqJob.reqArgs.dbUnitCount) {
        const missingUnitNames = _.difference(incomingObj.returnObj, aliveUnitNameArray);
        console.log("Db is missing ", missingUnitNames, " unit(s)");
        if (missingUnitNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncUnitInfo",
                    missingUnitNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }

    if (curReqJob.reqArgs.serverUnitCount < curReqJob.reqArgs.dbUnitCount) {
        // is missing empty, pull all units that are active and dont have ~ in unit/static name
        const nonPreBakedNames = await ddcsControllers.actionAliveNames({
            dead: false,
            category: { $ne: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE")},
            $or: [{isActive: false}, {_id: /~/}]
        });
        console.log("Units server: ", curReqJob.reqArgs.serverUnitCount, "bakedUnits: ", nonPreBakedNames.length);
        if ((curReqJob.reqArgs.serverUnitCount - nonPreBakedNames.length) === 0) {
            missionStartupUnitsReSync = true;
            console.log("MISSION IS EMPTY, respawn units from DB", missionStartupUnitsReSync);
            // sync up all units on server from database
            const units = await ddcsControllers.unitActionReadStd({
                dead: false,
                isActive: true,
                _id: {$not: /~/},
                category: { $ne: ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE")}
            });

            if (units.length > 0) {
                const remappedunits: any = {};
                for (const unit of units) {
                    const curGrpName = unit.groupName;
                    if (ddcsControllers.UNIT_CATEGORY[unit.category] === "GROUND_UNIT" && !unit.isTroop) {
                        remappedunits[curGrpName] = remappedunits[curGrpName] || [];
                        remappedunits[curGrpName].push(unit);
                    } else {
                        await ddcsControllers.unitActionUpdate({
                            _id: unit.name,
                            dead: true
                        });
                    }
                }
                for (const [key, value] of Object.entries(remappedunits)) {
                    await ddcsControllers.spawnUnitGroup(value as any[]);
                }
            }
        } else {
            if (!missionStartupUnitsReSync) {
                console.log("MISSION IS NOT EMPTY, Sync Server -> Db (mark db units not on server as dead)");
                const missingUnitNames = _.difference(aliveUnitNameArray, incomingObj.returnObj);
                console.log("Server is missing ", missingUnitNames, " unit(s)");
                if (missingUnitNames.length > 0) {
                    await ddcsControllers.sendUDPPacket("frontEnd", {
                        actionObj: {
                            action: "reSyncUnitInfo",
                            missingUnitNames,
                            reqID: 0, // dont run anything with return data
                            time: new Date()
                        }
                    });
                }
            } else {
                // when server units are fully sync, unlock missing unit names
                console.log("STILL SYNC UNITS");
            }
        }
    }
    requestJobArray.splice(curReqJobIndex, 1);
}

export async function reSyncServerStatics(serverStaticCount: number, dbStaticCount: number): Promise<void> {
    const curNextUniqueId = getNextUniqueId();
    requestJobArray.push({
        reqId: curNextUniqueId,
        callBack: "syncStaticsNames",
        reqArgs: {
            serverStaticCount,
            dbStaticCount
        }
    });

    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "getStaticsNames",
            reqID: curNextUniqueId,
            time: new Date()
        }
    });
}

export async function reSyncServerUnits(serverUnitCount: number, dbUnitCount: number) {
    const curNextUniqueId = getNextUniqueId();
    requestJobArray.push({
        reqId: curNextUniqueId,
        callBack: "syncUnitsNames",
        reqArgs: {
            serverUnitCount,
            dbUnitCount
        }
    });
    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "getUnitNames",
            reqID: curNextUniqueId,
            time: new Date()
        }
    });
}

export async function syncCheck(serverUnitCount: number, serverStaticCount: number): Promise<void> {
    if (getSessionName()) {
        const servers = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers && servers[0]) {
            const curAliveUnitCount = await ddcsControllers.actionCount({dead: false, category: { $ne: 4}});
            const curAliveStaticCount = await ddcsControllers.actionCount({dead: false, category: 4});
            if ( serverUnitCount !== curAliveUnitCount) {
                await reSyncServerUnits(serverUnitCount, curAliveUnitCount);
            }
            if ( serverStaticCount !== curAliveStaticCount) {
                await reSyncServerStatics(serverStaticCount, curAliveStaticCount);
            }
        }
    }
}


/*
export async function syncCheck123(serverUnitCount: number): Promise<void> {
    // if no session is set, server hasn't initiated yet, hold off
    if (getSessionName()) {
        const servers = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers && servers[0]) {
            if (serverUnitCount === 0) {
                // Empty Server
                await spawnEmptyStaticsServer();
                await spawnEmptyUnitsServer();



            } else {
                // existing server
                const curDbUnitArray = await ddcsControllers.unitActionRead({});
                if ( serverUnitCount !== curDbUnitArray.length) {
                    await resyncServerStatics();
                    await resyncServerUnits();
                }
            }

            // sync base ownership

            // unlock server joining

            //
        }
    }
}
*/
