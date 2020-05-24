/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";
import { getSessionName } from "../";

export const requestJobArray: any[] = [];

let isServerSynced = true;
let isSyncLockDownMode = false; // lock all processes out until server fully syncs
let isReSyncLock = false;
let nextUniqueId = 0;

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
    isSyncLockDownMode = flag;
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
                            await ddcsControllers.spawnGroup(group);
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

export function syncStaticNames(nameArray: string[]): void {
    console.log("syncStaticNames: ", nameArray);
}

export function syncUnitsNames(nameArray: string[]): void {
    console.log("UNIT LIST BACK");
    console.log("syncUnitNames: ", nameArray);
}

export async function reSyncServerStatics(): Promise<void> {
    const curNextUniqueId = getNextUniqueId();
    requestJobArray.push({
        reqId: curNextUniqueId,
        callBack: "syncStaticNames",
        time: new Date()
    });

    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "getStaticNames",
            reqID: curNextUniqueId,
            time: new Date()
        }
    });
}

export async function reSyncServerUnits() {
    const curNextUniqueId = getNextUniqueId();
    requestJobArray.push({
        reqId: curNextUniqueId,
        callBack: "syncUnitsNames"
    });
    console.log("SEND UNIT RESYNC PACKET");
    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "getUnitNames",
            reqID: curNextUniqueId
        }
    });
}

export async function syncCheck(serverUnitCount: number): Promise<void> {
    if (!isReSyncLock && getSessionName()) {
        const servers = await ddcsControllers.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers && servers[0]) {
            const curAliveUnitCount = await ddcsControllers.unitActionCount({dead: false});
            if ( serverUnitCount !== curAliveUnitCount) {
                // lock into re-sync mode, so not run this until re-sync are unlocked
                setReSyncLock(false);
                console.log("RESYNC START");
                // await reSyncServerStatics();
                await reSyncServerUnits();
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
