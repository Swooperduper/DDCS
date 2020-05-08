/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

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
    const units = await ddcsController.unitActionReadStd({dead: false});
    if (serverUnitCount === 0) { // server is empty
        ddcsController.setLockUpdates(false);
        ddcsController.resetEWRUnitsActivated();
        isServerSynced = false;
        isServerFresh = true;
        if (!isSyncLockdownMode) {
            ddcsController.resetTimerObj();
            isSyncLockdownMode = true; // lock down all traffic until sync is complete
            if (units.length === 0) { // DB is empty
                console.log("DB & Server is empty of Units, Spawn New Units");
                const newCampaignName = process.env.SERVER_NAME + "_" + new Date().getTime();
                await ddcsController.campaignsActionsSave({_id: newCampaignName});
                await ddcsController.sessionsActionsSave({
                    _id: newCampaignName,
                    name: newCampaignName,
                    campaignName: newCampaignName
                });
                masterUnitCount = await ddcsController.spawnNewMapGrps(); // respond with server spawned num
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
                        await ddcsController.spawnLogisticCmdCenter(unit, true);
                    } else if (unit.type === "Comms tower M") {
                        await ddcsController.spawnRadioTower(unit, true);
                    } else {
                        await ddcsController.unitActionUpdate({
                            _id: unit.name,
                            name: unit.name,
                            dead: true
                        });
                    }
                }
                for (const group of remappedunits) {
                    await ddcsController.spawnGroup(group);
                }
                const staticCrates = await ddcsController.staticCrateActionRead({});
                for (const crateObj of staticCrates) {
                    await ddcsController.spawnLogiCrate(crateObj);
                }
            }
            processInstructions = true;
            console.log("processed Instructons 2: ", processInstructions);
        } else {
            console.log("syncro mode is on lockdown: ", isSyncLockdownMode);
        }
    } else {
        if (isServerFresh) { // server is fresh
            ddcsController.resetEWRUnitsActivated();
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
                            await ddcsController.cmdQueActionsSave({
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
                    await ddcsController.sendMesgChatWindow(mesg);
                    isServerSynced = false;
                } else {
                    if (!isServerSynced && units.length > 50) {
                        mesg = "Server units are Synced, Slots Now Open!";
                        console.log(mesg);
                        await ddcsController.sendMesgChatWindow(mesg);
                        isServerSynced = true;
                        isServerFresh = false;
                        await ddcsController.setIsOpenSlotFlag(1);
                        await ddcsController.setSideLockFlags();
                        await ddcsController.setbaseSides();
                        await ddcsController.setFarpMarks();
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
                        await ddcsController.cmdQueActionsSave({
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
                    await ddcsController.setIsOpenSlotFlag(1);
                    await ddcsController.setbaseSides();
                    await ddcsController.setFarpMarks();
                }
            }
        }
    }
}

export async function syncType(serverUnitCount: number): Promise<void> {
    if (serverUnitCount > -1) {
        // check if server should be reset
        const servers = await ddcsController.serverActionsRead({_id: process.env.SERVER_NAME});
        if (servers.length > 0) {
            // console.log('t: ', _.get(curServer, 'resetFullCampaign', false), ' && ', serverUnitCount === 0);
            if (servers[0].resetFullCampaign && serverUnitCount === 0) {
                await ddcsController.clearCampaignTables();
                await ddcsController.serverActionsUpdate({resetFullCampaign: false});
                await syncServer(serverUnitCount);
            } else {
                await syncServer(serverUnitCount);
            }
        }
    }
}
