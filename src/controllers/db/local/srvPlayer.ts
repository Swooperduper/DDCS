/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../../typings";
import { dbModels } from "../common";
import * as ddcsController from "../../";

export async function srvPlayerActionsRead(obj: any): Promise<typings.ISrvPlayers[]> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find(obj, (err: any, srvPlayer: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            resolve(srvPlayer);
        });
    });
}

export async function srvPlayerActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function srvPlayerActionsUnsetGicTimeLeft(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.updateOne(
            {_id: obj._id},
            {$unset: { gicTimeLeft: "" }},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function srvPlayerActionsUpdateFromServer(obj: {
    _id: string,
    sessionName: string,
    side: number,
    sideLockTime: number,
    curLifePoints?: number,
    currentSessionMinutesPlayed_blue?: number,
    currentSessionMinutesPlayed_red?: number,
    ipaddr?: string,
    sideLock?: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            if (serverObj.length === 0) {

                if (obj.ipaddr === ":10308") {
                    obj.ipaddr = "127.0.0.1";
                }

                if (obj.side === 0) { // keep the user on the last side
                    delete obj.side;
                }
                obj.curLifePoints = ddcsController.config.startLifePoints;

                const sObj = new dbModels.srvPlayerModel(obj);
                sObj.save((saveErr: any) => {
                    if (saveErr) { reject(saveErr); }
                    resolve();
                });
            } else {
                const curPly = serverObj[0];
                if ((curPly.sessionName !== obj.sessionName) && curPly.sessionName && obj.sessionName) {
                    const curTime =  new Date().getTime();
                    obj.curLifePoints = ddcsController.config.startLifePoints;
                    obj.currentSessionMinutesPlayed_blue = 0;
                    obj.currentSessionMinutesPlayed_red = 0;
                    if (curPly.sideLockTime < curTime) {
                        obj.sideLockTime = curTime + ddcsController.time.oneHour;
                        obj.sideLock = 0;
                    }
                }
                if (obj.ipaddr === ":10308") {
                    obj.ipaddr = "127.0.0.1";
                }
                if (obj.side === 0) { // keep the user on the last side
                    delete obj.side;
                }

                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: obj},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        resolve();
                    }
                );
            }
        });
    });
}

export async function srvPlayerActionsAddLifePoints(obj: {
    _id: string,
    groupId: number,
    addLifePoints?: number,
    execAction?: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            const addPoints: number = (obj.addLifePoints) ? obj.addLifePoints : serverObj[0].cachedRemovedLPPoints;
            const curAction: string = "addLifePoint";
            const curPlayerLifePoints: number = serverObj[0].curLifePoints || 0;
            const curTotalPoints: number = (curPlayerLifePoints >= 0) ? curPlayerLifePoints + addPoints : addPoints;
            const maxLimitedPoints: number = (curTotalPoints > ddcsController.maxLifePoints) ?
                ddcsController.maxLifePoints : curTotalPoints;
            let msg;
            if (serverObj.length > 0) {
                const setObj = {
                    cachedRemovedLPPoints: (!obj.addLifePoints) ?  0 : undefined,
                    curLifePoints: maxLimitedPoints,
                    lastLifeAction: curAction,
                    safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                };
                dbModels.srvPlayerModel.findOneAndUpdate(
                    {_id: obj._id},
                    { $set: setObj },
                    (updateErr: any, srvPlayer: typings.ISrvPlayers) => {
                        if (updateErr) { reject(updateErr); }
                        if (obj.execAction === "PeriodicAdd") {
                            msg = "+" + _.round(addPoints, 2).toFixed(2) + "LP(T:" + maxLimitedPoints.toFixed(2) + ")";
                        } else {
                            msg = "You Have Just Gained " +
                                addPoints.toFixed(2) + " Life Points! " +
                                obj.execAction + "(Total:" + maxLimitedPoints.toFixed(2) + ")";
                        }
                        if (obj.groupId) {
                            ddcsController.sendMesgToGroup( obj.groupId, msg, 5);
                        }
                        resolve();
                    }
                );
            } else {
                resolve();
            }
        });
    });
}


export async function srvPlayerActionsRemoveLifePoints(obj: {
    _id: string,
    groupId: number,
    removeLifePoints: number,
    execAction?: string,
    storePoints?: boolean
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            const removePoints = obj.removeLifePoints;
            const curAction = "removeLifePoints";
            const curPlayerLifePoints = serverObj[0].curLifePoints || 0;
            const curTotalPoints = curPlayerLifePoints - removePoints;
            const maxLimitedPoints = (curTotalPoints > ddcsController.maxLifePoints) ? ddcsController.maxLifePoints : curTotalPoints;
            if (err) { reject(err); }
            if (serverObj.length > 0 && serverObj[0].playerId) {
                if (curTotalPoints < 0) {
                    ddcsController.forcePlayerSpectator(
                        serverObj[0].playerId,
                        "You Do Not Have Enough Points To Fly This Vehicle" +
                        "{" + removePoints.toFixed(2) + "/" + curPlayerLifePoints.toFixed(2) + ")"
                    );
                    resolve();
                } else {
                    const setObj = {
                        cachedRemovedLPPoints: (obj.storePoints) ? removePoints : undefined,
                        curLifePoints: maxLimitedPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                    };
                    dbModels.srvPlayerModel.findOneAndUpdate(
                        {_id: obj._id},
                        { $set: setObj },
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            ddcsController.sendMesgToGroup( obj.groupId, "You Have Just Used " +
                                removePoints.toFixed(2) + " Life Points! " + obj.execAction +
                                "(Total:" + curTotalPoints.toFixed(2) + ")", 5);
                            resolve();
                        }
                    );
                }
            } else {
                resolve();
            }
        });
    });
}

export async function srvPlayerActionsClearTempScore(obj: {
    _id: string,
    groupId: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: {tmpRSPoints: 0}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        ddcsController.sendMesgToGroup(
                            obj.groupId,
                            "Your Tmp Score Has Been Cleared",
                            15
                        );
                        resolve();
                    }
                );
            } else {
                resolve();
            }
        });
    });
}

export async function srvPlayerActionsAddTempScore(obj: {
    _id: string,
    groupId: number
    score?: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                const newTmpScore = (serverObj[0].tmpRSPoints || 0) + (obj.score || 0);
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: {tmpRSPoints: newTmpScore}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        if (ddcsController.config.inGameHitMessages) {
                            ddcsController.sendMesgToGroup(
                                obj.groupId,
                                "TmpScore: " + newTmpScore + ", Land at a friendly base/farp to receive these points",
                                15
                            );
                        }
                        resolve();
                    }
                );
            } else {
                resolve();
            }
        });
    });
}

export async function srvPlayerActionsApplyTempToRealScore(obj: {
    _id: string,
    groupId: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                let mesg: string;
                const curPly = serverObj[0];
                const rsTotals = {
                    redRSPoints: curPly.redRSPoints || 0,
                    blueRSPoints: curPly.blueRSPoints || 0,
                    tmpRSPoints: curPly.tmpRSPoints || 0
                };
                if (curPly.side === 1) {
                    rsTotals.redRSPoints = rsTotals.redRSPoints + rsTotals.tmpRSPoints;
                    mesg = "You have been awarded: " + rsTotals.tmpRSPoints + " Points, Total Red RS Points: " + rsTotals.redRSPoints;
                    rsTotals.tmpRSPoints = 0;
                }
                if (curPly.side === 2) {
                    rsTotals.blueRSPoints = rsTotals.blueRSPoints + rsTotals.tmpRSPoints;
                    mesg = "You have been awarded: " + rsTotals.tmpRSPoints + " Points, Total Blue RS Points: " + rsTotals.blueRSPoints;
                    rsTotals.tmpRSPoints = 0;
                }
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: rsTotals},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        console.log("aplyT2R: ", curPly.name, mesg);
                        ddcsController.sendMesgToGroup(obj.groupId, mesg, 15);
                        resolve();
                    }
                );
            } else {
                resolve();
            }
        });
    });
}

export async function srvPlayerActionsUnitAddToRealScore(obj: {
    _id: string,
    groupId: number,
    unitCoalition: number,
    score?: number,
    unitType?: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                let mesg: string;
                const curPly = serverObj[0];
                const addScore = obj.score || 0;
                const curType = obj.unitType || "";
                const tObj: any = {};
                if (obj.unitCoalition === curPly.side) {
                    if (curPly.side === 1) {
                        mesg = "You have been awarded " + addScore + " from your " + curType + " for red";
                        tObj.redRSPoints = (curPly.redRSPoints || 0) + addScore;
                    }
                    if (curPly.side === 2) {
                        mesg = "You have been awarded " + addScore + " from your " + curType + " for blue";
                        tObj.blueRSPoints = (curPly.blueRSPoints || 0) + addScore;
                    }
                    dbModels.srvPlayerModel.updateOne(
                        {_id: obj._id},
                        {$set: tObj},
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            console.log(obj.unitType + " has given " + addScore +
                                " to " + curPly.name + " on " + curPly.side + ", Total: ", tObj);
                            if (ddcsController.config.inGameHitMessages) {
                                ddcsController.sendMesgToGroup(
                                    obj.groupId,
                                    mesg,
                                    15
                                );
                            }
                            resolve();
                        }
                    );
                }
            } else {
                resolve();
            }
        });
    });
}

export async function srvPlayerActionsAddMinutesPlayed(obj: {
    _id: string,
    side: number,
    minutesPlayed?: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const sessionMinutesVar = "currentSessionMinutesPlayed_" + ddcsController.side[obj.side];
        dbModels.srvPlayerModel.find({ _id: obj._id }, (err: any, serverObj: any) => {
                if (err) { reject(err); }
                if (serverObj.length > 0) {
                    const curPlayer = serverObj;
                    console.log("Name: ", curPlayer.name, (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0));
                    dbModels.srvPlayerModel.updateOne(
                        { _id: obj._id },
                        { $set: { [sessionMinutesVar]: (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0) } },
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            resolve();
                        }
                    );
                } else {
                    resolve();
                }
            });
    });
}

export async function srvPlayerActionsResetMinutesPlayed(obj: {
    _id: string,
    side: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const sessionMinutesVar = "currentSessionMinutesPlayed_" + ddcsController.side[obj.side];
        dbModels.srvPlayerModel.updateOne(
            {_id: obj._id},
            {$set: {[sessionMinutesVar]: 0}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}
