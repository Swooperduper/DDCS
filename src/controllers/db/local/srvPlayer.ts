import {localConnection} from "../common/connection";
import {ISrvPlayers} from "../../../typings";
import {srvPlayerSchema} from "./schemas";

const srvPlayerTable = localConnection.model(process.env.SERVERNAME + "_srvPlayer", srvPlayerSchema);

export const srvPlayerActionsRead = (obj: ISrvPlayers) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find(obj, (err, srvPlayer) => {
            if (err) { reject(err); }
            resolve(srvPlayer);
        });
    });
};

export const srvPlayerActionsUpdate = (obj: ISrvPlayers) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err, serObj) => {
                if (err) { reject(err); }
                resolve(serObj);
            }
        );
    });
};

export const srvPlayerActionsUnsetGicTimeLeft = (obj: ISrvPlayers) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.updateOne(
            {_id: obj._id},
            {$unset: { gicTimeLeft: "" }},
            (err, serObj) => {
                if (err) { reject(err); }
                resolve(serObj);
            }
        );
    });
};

export const srvPlayerActionsUpdateFromServer = (obj: {
    _id: string,
    sessionName: string,
    side: number,
    curLifePoints?: number,
    currentSessionMinutesPlayed_blue?: number,
    currentSessionMinutesPlayed_red?: number,
    ipaddr?: string,
    sideLockTime: number,
    sideLock?: number
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err, serverObj: ISrvPlayers[]) => {
            if (err) { reject(err); }
            if (serverObj.length === 0) {
                const sObj: any = new srvPlayerTable(obj);
                if (sObj.ipaddr === ":10308") {
                    sObj.ipaddr = "127.0.0.1";
                }

                if (sObj.side === 0) { // keep the user on the last side
                    delete sObj.side;
                }
                sObj.curLifePoints = constants.config.startLifePoints;
                sObj.save((saveErr: any, serObj: ISrvPlayers) => {
                    if (saveErr) { reject(saveErr); }
                    resolve(serObj);
                });
            } else {
                const curPly = _.first(serverObj);
                if ((curPly.sessionName !== obj.sessionName) && curPly.sessionName && obj.sessionName) {
                    const curTime =  new Date().getTime();
                    obj.curLifePoints = constants.config.startLifePoints;
                    obj.currentSessionMinutesPlayed_blue = 0;
                    obj.currentSessionMinutesPlayed_red = 0;
                    if (curPly.sideLockTime < curTime) {
                        obj.sideLockTime = curTime + constants.time.oneHour;
                        obj.sideLock = 0;
                    }
                }
                if (obj.ipaddr === ":10308") {
                    obj.ipaddr = "127.0.0.1";
                }
                if (obj.side === 0) { // keep the user on the last side
                    delete obj.side;
                }

                srvPlayerTable.updateOne(
                    {_id: obj._id},
                    {$set: obj},
                    (updateErr, serObj) => {
                        if (updateErr) { reject(updateErr); }
                        resolve(serObj);
                    }
                );
            }
        });
    });
};

export const srvPlayerActionsAddLifePoints = (obj: {
    _id: string,
    groupId: number,
    addLifePoints?: number,
    execAction?: string
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err: any, serverObj: ISrvPlayers[]) => {
            if (err) { reject(err); }
            const addPoints: number = (obj.addLifePoints) ? obj.addLifePoints : _.first(serverObj).cachedRemovedLPPoints;
            const curAction: string = "addLifePoint";
            const curPlayerLifePoints: number = _.first(serverObj).curLifePoints || 0;
            const curTotalPoints: number = (curPlayerLifePoints >= 0) ? curPlayerLifePoints + addPoints : addPoints;
            const maxLimitedPoints: number = (curTotalPoints > constants.maxLifePoints) ? constants.maxLifePoints : curTotalPoints;
            let msg;
            if (serverObj.length > 0) {
                const setObj = {
                    cachedRemovedLPPoints: (!obj.addLifePoints) ?  0 : undefined,
                    curLifePoints: maxLimitedPoints,
                    lastLifeAction: curAction,
                    safeLifeActionTime: new Date().getTime() + constants.time.fifteenSecs
                };
                srvPlayerTable.findOneAndUpdate(
                    {_id: obj._id},
                    { $set: setObj },
                    (updateErr: any, srvPlayer) => {
                        if (updateErr) { reject(updateErr); }
                        if (obj.execAction === "PeriodicAdd") {
                            msg = "+" + _.round(addPoints, 2).toFixed(2) + "LP(T:" + maxLimitedPoints.toFixed(2) + ")";
                        } else {
                            msg = "You Have Just Gained " +
                                addPoints.toFixed(2) + " Life Points! " +
                                obj.execAction + "(Total:" + maxLimitedPoints.toFixed(2) + ")";
                        }
                        if (obj.groupId) {
                            DCSLuaCommands.sendMesgToGroup( obj.groupId, msg, 5);
                        }
                        resolve(srvPlayer);
                    }
                );
            } else {
                resolve("line128: Error: No Record in player db" + obj._id);
            }
        });
    });
};


export const srvPlayerActionsRemoveLifePoints = (obj: {
    _id: string,
    groupId: number,
    removeLifePoints: number,
    execAction?: string,
    storePoints?: number
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err: any, serverObj: ISrvPlayers[]) => {
            const removePoints = obj.removeLifePoints;
            const curAction = "removeLifePoints";
            const curPlayerObj = _.first(serverObj);
            const curPlayerLifePoints = curPlayerObj.curLifePoints || 0;
            const curTotalPoints = curPlayerLifePoints - removePoints;
            const maxLimitedPoints = (curTotalPoints > constants.maxLifePoints) ? constants.maxLifePoints : curTotalPoints;
            if (err) { reject(err); }
            if (serverObj.length > 0) {
                if (curTotalPoints < 0) {
                    DCSLuaCommands.forcePlayerSpectator(
                        curPlayerObj.playerId,
                        "You Do Not Have Enough Points To Fly This Vehicle" +
                        "{" + removePoints.toFixed(2) + "/" + curPlayerLifePoints.toFixed(2) + ")"
                    );
                    resolve(serverObj);
                } else {
                    const setObj = {
                        cachedRemovedLPPoints: (obj.storePoints) ? removePoints : undefined,
                        curLifePoints: maxLimitedPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + constants.time.fifteenSecs
                    };
                    srvPlayerTable.findOneAndUpdate(
                        {_id: obj._id},
                        { $set: setObj },
                        (updateErr, srvPlayer) => {
                            if (updateErr) { reject(updateErr); }
                            DCSLuaCommands.sendMesgToGroup( obj.groupId, "You Have Just Used " +
                                removePoints.toFixed(2) + " Life Points! " + obj.execAction +
                                "(Total:" + curTotalPoints.toFixed(2) + ")", 5);
                            resolve(srvPlayer);
                        }
                    );
                }
            } else {
                resolve("line 173: no players for id: " + obj._id);
            }
        });
    });
};

export const srvPlayerActionsClearTempScore = (obj: {
    _id: string,
    groupId: number
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err, serverObj) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                srvPlayerTable.updateOne(
                    {_id: obj._id},
                    {$set: {tmpRSPoints: 0}},
                    (updateErr) => {
                        if (updateErr) { reject(updateErr); }
                        DCSLuaCommands.sendMesgToGroup(
                            obj.groupId,
                            "Your Tmp Score Has Been Cleared",
                            "15"
                        );
                        resolve();
                    }
                );
            } else {
                resolve("line 198: no players for id: " + obj._id);
            }
        });
    });
};

export const srvPlayerActionsAddTempScore = (obj: {
    _id: string,
    groupId: number
    score?: number
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err, serverObj) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                const newTmpScore = (_.first(serverObj).tmpRSPoints || 0) + (obj.score || 0);
                srvPlayerTable.updateOne(
                    {_id: obj._id},
                    {$set: {tmpRSPoints: newTmpScore}},
                    (updateErr) => {
                        if (updateErr) { reject(updateErr); }
                        if (constants.config.inGameHitMessages) {
                            DCSLuaCommands.sendMesgToGroup(
                                obj.groupId,
                                "TmpScore: " + newTmpScore + ", Land at a friendly base/farp to receive these points",
                                "15"
                            );
                        }
                        resolve();
                    }
                );
            } else {
                resolve("line 226: no players for id: " + obj._id);
            }
        });
    });
};

export const srvPlayerActionsApplyTempToRealScore = (obj: {
    _id: string,
    groupId: number
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err, serverObj) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                let mesg: string;
                const curPly = _.first(serverObj);
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
                srvPlayerTable.updateOne(
                    {_id: obj._id},
                    {$set: rsTotals},
                    (updateErr) => {
                        if (updateErr) { reject(updateErr); }
                        console.log("aplyT2R: ", curPly.name, mesg);
                        DCSLuaCommands.sendMesgToGroup(obj.groupId, mesg, "15");
                        resolve();
                    }
                );
            } else {
                resolve("line 265: no players for id: " + obj._id);
            }
        });
    });
};

export const srvPlayerActionsUnitAddToRealScore = (obj: {
    _id: string,
    groupId: number,
    unitCoalition: number,
    score?: number,
    unitType?: string
}) => {
    return new Promise((resolve, reject) => {
        srvPlayerTable.find({_id: obj._id}, (err, serverObj) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                let mesg: string;
                const curPly = _.first(serverObj);
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
                    srvPlayerTable.updateOne(
                        {_id: obj._id},
                        {$set: tObj},
                        (updateErr) => {
                            if (updateErr) { reject(updateErr); }
                            console.log(obj.unitType + " has given " + addScore +
                                " to " + curPly.name + " on " + curPly.side + ", Total: ", tObj);
                            if (constants.config.inGameHitMessages) {
                                DCSLuaCommands.sendMesgToGroup(
                                    obj.groupId,
                                    mesg,
                                    "15"
                                );
                            }
                            resolve();
                        }
                    );
                }
            } else {
                resolve("line 315: no players for id: " + obj._id);
            }
        });
    });
};

export const srvPlayerActionsAddMinutesPlayed = (obj: {
    _id: string,
    side: number,
    minutesPlayed?: number
}) => {
    return new Promise((resolve, reject) => {
        const sessionMinutesVar = "currentSessionMinutesPlayed_" + constants.side[obj.side];
        srvPlayerTable.find({ _id: obj._id }, (err, serverObj) => {
                if (err) { reject(err); }
                if (serverObj.length > 0) {
                    const curPlayer = _.first(serverObj);
                    console.log("Name: ", curPlayer.name, (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0));
                    srvPlayerTable.updateOne(
                        { _id: obj._id },
                        { $set: { [sessionMinutesVar]: (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0) } },
                        (updateErr) => {
                            if (updateErr) { reject(updateErr); }
                            resolve();
                        }
                    );
                } else {
                    resolve("line 341: no players for id: " + obj._id);
                }
            });
    });
};

export const srvPlayerActionsResetMinutesPlayed = (obj: {
    _id: string,
    side: number
}) => {
    return new Promise((resolve, reject) => {
        const sessionMinutesVar = "currentSessionMinutesPlayed_" + constants.side[obj.side];
        srvPlayerTable.updateOne(
            {_id: obj._id},
            {$set: {[sessionMinutesVar]: 0}},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
};
