/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as action from "../action";
import * as localDb from "../db/local";
import * as playerLib from "../player";
import * as remoteDb from "../db/remote";
import * as serverToDbSync from "../serverToDbSync";
import * as spawn from "../spawn";

let mesg;
let masterUnitCount;
let lastUnitCount: any;
let isServerFresh = false;
let stuckDetect = 0;
const stuckThreshold = 30;
export let isServerSynced = false;
export let isSyncLockdownMode = false; // lock all processes out until server fully syncs
export let processInstructions = false;

export function setSyncLockdownMode(flag: boolean) {
    isSyncLockdownMode = flag;
}

export async function syncServer(serverUnitCount: number): Promise<void> {
    const remappedunits: any = {};
    const units = await localDb.unitActionReadStd({dead: false});
    if (serverUnitCount === 0) { // server is empty
        serverToDbSync.setLockUpdates(false);
        action.resetEWRUnitsActivated();
        isServerSynced = false;
        isServerFresh = true;
        if (!isSyncLockdownMode) {
            action.resetTimerObj();
            isSyncLockdownMode = true; // lock down all traffic until sync is complete
            if (units.length === 0) { // DB is empty
                console.log("DB & Server is empty of Units, Spawn New Units");
                const newCampaignName = process.env.SERVER_NAME + "_" + new Date().getTime();
                await localDb.campaignsActionsSave({_id: newCampaignName});
                await localDb.sessionsActionsSave({
                    _id: newCampaignName,
                    name: newCampaignName,
                    campaignName: newCampaignName
                });
                masterUnitCount = await spawn.spawnNewMapGrps(); // respond with server spawned num
                processInstructions = true;
                console.log("processed Instructons 1: ", processInstructions);
            } else { // DB is FULL
                console.log("DB has " + units.length + " Units, Respawn Them");
                const filterStructure = _.filter(units, {category: "STRUCTURE"});
                const filterGround = _.filter(units, {category: "GROUND"});
                // const filterShips = _.filter(units, {category: "SHIP"});
                masterUnitCount = filterStructure.length + filterGround.length;
                for (const unit of units) {
                    const curGrpName = unit.groupName;
                    if (unit.category === "GROUND" && !unit.isTroop && !unit.isAI) {
                        remappedunits[curGrpName] = remappedunits[curGrpName] || [];
                        remappedunits[curGrpName].push(unit);
                    } else if (unit.type === ".Command Center") {
                        await spawn.spawnLogisticCmdCenter(unit, true);
                    } else if (unit.type === "Comms tower M") {
                        await spawn.spawnRadioTower(unit, true);
                    } else {
                        await localDb.unitActionUpdate({
                            _id: unit.name,
                            name: unit.name,
                            dead: true
                        });
                    }
                }
                for (const group of remappedunits) {
                    await spawn.spawnGroup(group);
                }
                const staticCrates = await localDb.staticCrateActionRead({});
                for (const crateObj of staticCrates) {
                    await spawn.spawnLogiCrate(crateObj);
                }
            }
            processInstructions = true;
            console.log("processed Instructons 2: ", processInstructions);
        } else {
            console.log("syncro mode is on lockdown: ", isSyncLockdownMode);
        }
    } else {
        if (isServerFresh) { // server is fresh
            action.resetEWRUnitsActivated();
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
                            await localDb.cmdQueActionsSave({
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
                    await playerLib.sendMesgChatWindow(mesg);
                    isServerSynced = false;
                } else {
                    if (!isServerSynced && units.length > 50) {
                        mesg = "Server units are Synced, Slots Now Open!";
                        console.log(mesg);
                        await playerLib.sendMesgChatWindow(mesg);
                        isServerSynced = true;
                        isServerFresh = false;
                        await playerLib.setIsOpenSlotFlag(1);
                        await action.setSideLockFlags();
                        await action.setbaseSides();
                        await action.setFarpMarks();
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
                        await localDb.cmdQueActionsSave({
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
                    await playerLib.setIsOpenSlotFlag(1);
                    await action.setbaseSides();
                    await action.setFarpMarks();
                }
            }
        }
    }
}

export async function syncType(serverUnitCount: number): Promise<void> {
    if (serverUnitCount > -1) {
        // check if server should be reset
        const servers = await remoteDb.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers.length > 0) {
            // console.log('t: ', _.get(curServer, 'resetFullCampaign', false), ' && ', serverUnitCount === 0);
            if (servers[0].resetFullCampaign && serverUnitCount === 0) {
                await action.clearCampaignTables();
                await remoteDb.serverActionsUpdate({resetFullCampaign: false});
                await syncServer(serverUnitCount);
            } else {
                await syncServer(serverUnitCount);
            }
        }
    }
}
