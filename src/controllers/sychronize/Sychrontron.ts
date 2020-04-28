/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
import * as groupController from "../spawn/group";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as crateController from "../spawn/crate";
import * as sideLockController from "../action/sideLock";
import * as taskController from "../action/task";
import * as baseSpawnFlagsController from "../action/baseSpawnFlags";
import * as serverTimerController from "../action/serverTimer";
import * as f10MarksController from "../action/f10Marks";
import * as unitsStaticsController from "../serverToDbSync/unitsStatics";
import * as resetCampaignController from "../action/resetCampaign";

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

export async function syncServer(serverUnitCount: number) {
    const remappedunits: any = {};
    masterDBController.unitActionReadStd({dead: false})
        .then((units) => {
            if (serverUnitCount === 0) { // server is empty
                unitsStaticsController.setLockUpdates(false);
                taskController.resetEWRUnitsActivated();
                exports.isServerSynced = false;
                isServerFresh = true;
                if (!exports.isSyncLockdownMode) {
                    serverTimerController.resetTimerObj();
                    exports.isSyncLockdownMode = true; // lock down all traffic until sync is complete
                    if (units.length === 0) { // DB is empty
                        console.log("DB & Server is empty of Units, Spawn New Units");
                        const newCampaignName = process.env.SERVER_NAME + "_" + new Date().getTime();
                        masterDBController.campaignsActionsSave({_id: newCampaignName})
                            .then(() => {
                                masterDBController.sessionsActionsSave({
                                    _id: newCampaignName,
                                    name: newCampaignName,
                                    campaignName: newCampaignName
                                })
                                    .then(() => {
                                        masterUnitCount = groupController.spawnNewMapGrps(); // respond with server spawned num
                                        exports.processInstructions = true;
                                        console.log("processed Instructons 1: ", exports.processInstructions);
                                    })
                                    .catch((err) => {
                                        console.log("line49", err);
                                    });
                            })
                            .catch((err) => {
                                console.log("erroring line59: ", err);
                            })
                        ;
                    } else { // DB is FULL
                        console.log("DB has " + units.length + " Units, Respawn Them");
                        const filterStructure = _.filter(units, {category: "STRUCTURE"});
                        const filterGround = _.filter(units, {category: "GROUND"});
                        // const filterShips = _.filter(units, {category: "SHIP"});
                        masterUnitCount = filterStructure.length + filterGround.length;
                        _.forEach(units, (unit: any) => {
                            const curGrpName = unit.groupName;
                            if (unit.category === "GROUND" && !unit.isTroop && !unit.isAI) {
                                remappedunits[curGrpName] = remappedunits[curGrpName] || [];
                                remappedunits[curGrpName].push(unit);
                            } else if (unit.type === ".Command Center") {
                                groupController.spawnLogisticCmdCenter(unit, true);
                            } else if (unit.type === "Comms tower M") {
                                groupController.spawnRadioTower(unit, true);
                            } else {
                                // console.log('marking unit dead: ', unit);
                                masterDBController.unitActionUpdate({
                                    _id: unit.name,
                                    name: unit.name,
                                    dead: true
                                })
                                    .catch((err) => {
                                        console.log("erroring line90: ", err);
                                    });
                            }
                        });
                        _.forEach(remappedunits, (group) => {
                            groupController.spawnGroup(group);
                        });
                        masterDBController.staticCrateActionRead({})
                            .then((staticCrates: any) => {
                                _.forEach(staticCrates, (crateObj) => {
                                    crateController.spawnLogiCrate(crateObj);
                                });
                            })
                            .catch((err) => {
                                console.log("line 70: ", err);
                            })
                        ;
                    }
                    exports.processInstructions = true;
                    console.log("processed Instructons 2: ", exports.processInstructions);
                } else {
                    console.log("syncro mode is on lockdown: ", exports.isSyncLockdownMode);
                }
           } else {
                if (isServerFresh) { // server is fresh
                    taskController.resetEWRUnitsActivated();
                    if (exports.processInstructions) {
                        if (serverUnitCount !== units.length) {
                            if (lastUnitCount === serverUnitCount) {
                                if (stuckDetect > 5) {
                                    mesg = "STUCK|" + stuckDetect + "|F|" + units.length + ":" + serverUnitCount + ":" +
                                        exports.isServerSynced + ":" + exports.isSyncLockdownMode;
                                } else {
                                    mesg = "SYNCING|F|" + units.length + ":" + serverUnitCount;
                                }
                                if (stuckDetect > stuckThreshold) {
                                    masterDBController.cmdQueActionsSave({
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
                            DCSLuaCommands.sendMesgChatWindow(mesg);
                            exports.isServerSynced = false;
                        } else {
                            if (!exports.isServerSynced && units.length > 50) {
                                mesg = "Server units are Synced, Slots Now Open!";
                                console.log(mesg);
                                DCSLuaCommands.sendMesgChatWindow(mesg);
                                exports.isServerSynced = true;
                                isServerFresh = false;
                                DCSLuaCommands.setIsOpenSlotFlag(1);
                                sideLockController.setSideLockFlags();
                                baseSpawnFlagsController.setbaseSides();
                                f10MarksController.setFarpMarks();
                            } else {
                                console.log("failing  !exports.isServerSynced && units.length > 50",
                                    !exports.isServerSynced, " && ", units.length > 100);
                            }
                        }
                    } else {
                        console.log("No Sync Instructions to be processed", exports.processInstructions);
                    }
                } else { // server has units on it
                    if (units.length !== serverUnitCount) { // db doesnt match server
                        if (lastUnitCount === serverUnitCount) {
                            if (stuckDetect > 5) {
                                mesg = "STUCK|" + stuckDetect + "|R1|" + units.length + ":" + serverUnitCount + ":" +
                                    exports.isServerSynced + ":" + exports.isSyncLockdownMode;
                            } else {
                                mesg = "SYNCING|R1|" + units.length + ":" + serverUnitCount;
                            }
                            if (stuckDetect > stuckThreshold) {
                                masterDBController.cmdQueActionsSave({
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
                        exports.isServerSynced = true;
                        console.log(mesg);
                        // DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
                        // exports.isServerSynced = true;
                    } else {
                        if (!exports.isServerSynced && units.length > 50) {
                            mesg = "Server units Synced";
                            console.log(mesg);
                            // DCSLuaCommands.sendMesgChatWindow(serverName, mesg);
                            exports.isServerSynced = true;
                            DCSLuaCommands.setIsOpenSlotFlag(1);
                            baseSpawnFlagsController.setbaseSides();
                            f10MarksController.setFarpMarks();
                        }
                    }
                }
            }
        })
        .catch((err) => {
            console.log("erroring line206: ", err);
        });
}

export async function syncType(serverUnitCount: number) {
    if (serverUnitCount > -1) {
        // check if server should be reset
        masterDBController.serverActionsRead({_id: process.env.SERVER_NAME})
            .then((servers: any) => {
                if (servers.length > 0) {
                    // console.log('t: ', _.get(curServer, 'resetFullCampaign', false), ' && ', serverUnitCount === 0);
                    if (servers[0].resetFullCampaign && serverUnitCount === 0) {
                        resetCampaignController.clearCampaignTables()
                            .then(() => {
                                masterDBController.serverActionsUpdate({resetFullCampaign: false})
                                    .then(() => {
                                        exports.syncServer(serverUnitCount);
                                    })
                                    .catch((err) => {
                                        console.log("erroring line220: ", err);
                                    })
                                ;
                            })
                            .catch((err) => {
                                console.log("erroring line225: ", err);
                            })
                        ;
                    } else {
                        exports.syncServer(serverUnitCount);
                    }
                }
            })
            .catch((err) => {
                console.log("erroring line206: ", err);
            });
    }
}
