"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("./schemas");
var srvPlayerTable = connection_1.localConnection.model(process.env.SERVERNAME + "_srvPlayer", schemas_1.srvPlayerSchema);
exports.srvPlayerActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find(obj, function (err, srvPlayer) {
            if (err) {
                reject(err);
            }
            resolve(srvPlayer);
        });
    });
};
exports.srvPlayerActionsUpdate = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.updateOne({ _id: obj._id }, { $set: obj }, function (err, serObj) {
            if (err) {
                reject(err);
            }
            resolve(serObj);
        });
    });
};
exports.srvPlayerActionsUnsetGicTimeLeft = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.updateOne({ _id: obj._id }, { $unset: { gicTimeLeft: "" } }, function (err, serObj) {
            if (err) {
                reject(err);
            }
            resolve(serObj);
        });
    });
};
exports.srvPlayerActionsUpdateFromServer = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            if (serverObj.length === 0) {
                var sObj = new srvPlayerTable(obj);
                if (sObj.ipaddr === ":10308") {
                    sObj.ipaddr = "127.0.0.1";
                }
                if (sObj.side === 0) { // keep the user on the last side
                    delete sObj.side;
                }
                sObj.curLifePoints = constants.config.startLifePoints;
                sObj.save(function (saveErr, serObj) {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve(serObj);
                });
            }
            else {
                var curPly = _.first(serverObj);
                if ((curPly.sessionName !== obj.sessionName) && curPly.sessionName && obj.sessionName) {
                    var curTime = new Date().getTime();
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
                srvPlayerTable.updateOne({ _id: obj._id }, { $set: obj }, function (updateErr, serObj) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    resolve(serObj);
                });
            }
        });
    });
};
exports.srvPlayerActionsAddLifePoints = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            var addPoints = (obj.addLifePoints) ? obj.addLifePoints : _.first(serverObj).cachedRemovedLPPoints;
            var curAction = "addLifePoint";
            var curPlayerLifePoints = _.first(serverObj).curLifePoints || 0;
            var curTotalPoints = (curPlayerLifePoints >= 0) ? curPlayerLifePoints + addPoints : addPoints;
            var maxLimitedPoints = (curTotalPoints > constants.maxLifePoints) ? constants.maxLifePoints : curTotalPoints;
            var msg;
            if (serverObj.length > 0) {
                var setObj = {
                    cachedRemovedLPPoints: (!obj.addLifePoints) ? 0 : undefined,
                    curLifePoints: maxLimitedPoints,
                    lastLifeAction: curAction,
                    safeLifeActionTime: new Date().getTime() + constants.time.fifteenSecs
                };
                srvPlayerTable.findOneAndUpdate({ _id: obj._id }, { $set: setObj }, function (updateErr, srvPlayer) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    if (obj.execAction === "PeriodicAdd") {
                        msg = "+" + _.round(addPoints, 2).toFixed(2) + "LP(T:" + maxLimitedPoints.toFixed(2) + ")";
                    }
                    else {
                        msg = "You Have Just Gained " +
                            addPoints.toFixed(2) + " Life Points! " +
                            obj.execAction + "(Total:" + maxLimitedPoints.toFixed(2) + ")";
                    }
                    if (obj.groupId) {
                        DCSLuaCommands.sendMesgToGroup(obj.groupId, msg, 5);
                    }
                    resolve(srvPlayer);
                });
            }
            else {
                resolve("line128: Error: No Record in player db" + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsRemoveLifePoints = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            var removePoints = obj.removeLifePoints;
            var curAction = "removeLifePoints";
            var curPlayerObj = _.first(serverObj);
            var curPlayerLifePoints = curPlayerObj.curLifePoints || 0;
            var curTotalPoints = curPlayerLifePoints - removePoints;
            var maxLimitedPoints = (curTotalPoints > constants.maxLifePoints) ? constants.maxLifePoints : curTotalPoints;
            if (err) {
                reject(err);
            }
            if (serverObj.length > 0) {
                if (curTotalPoints < 0) {
                    DCSLuaCommands.forcePlayerSpectator(curPlayerObj.playerId, "You Do Not Have Enough Points To Fly This Vehicle" +
                        "{" + removePoints.toFixed(2) + "/" + curPlayerLifePoints.toFixed(2) + ")");
                    resolve(serverObj);
                }
                else {
                    var setObj = {
                        cachedRemovedLPPoints: (obj.storePoints) ? removePoints : undefined,
                        curLifePoints: maxLimitedPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + constants.time.fifteenSecs
                    };
                    srvPlayerTable.findOneAndUpdate({ _id: obj._id }, { $set: setObj }, function (updateErr, srvPlayer) {
                        if (updateErr) {
                            reject(updateErr);
                        }
                        DCSLuaCommands.sendMesgToGroup(obj.groupId, "You Have Just Used " +
                            removePoints.toFixed(2) + " Life Points! " + obj.execAction +
                            "(Total:" + curTotalPoints.toFixed(2) + ")", 5);
                        resolve(srvPlayer);
                    });
                }
            }
            else {
                resolve("line 173: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsClearTempScore = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            if (serverObj.length !== 0) {
                srvPlayerTable.updateOne({ _id: obj._id }, { $set: { tmpRSPoints: 0 } }, function (updateErr) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    DCSLuaCommands.sendMesgToGroup(obj.groupId, "Your Tmp Score Has Been Cleared", "15");
                    resolve();
                });
            }
            else {
                resolve("line 198: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsAddTempScore = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            if (serverObj.length !== 0) {
                var newTmpScore_1 = (_.first(serverObj).tmpRSPoints || 0) + (obj.score || 0);
                srvPlayerTable.updateOne({ _id: obj._id }, { $set: { tmpRSPoints: newTmpScore_1 } }, function (updateErr) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    if (constants.config.inGameHitMessages) {
                        DCSLuaCommands.sendMesgToGroup(obj.groupId, "TmpScore: " + newTmpScore_1 + ", Land at a friendly base/farp to receive these points", "15");
                    }
                    resolve();
                });
            }
            else {
                resolve("line 226: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsApplyTempToRealScore = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            if (serverObj.length !== 0) {
                var mesg_1;
                var curPly_1 = _.first(serverObj);
                var rsTotals = {
                    redRSPoints: curPly_1.redRSPoints || 0,
                    blueRSPoints: curPly_1.blueRSPoints || 0,
                    tmpRSPoints: curPly_1.tmpRSPoints || 0
                };
                if (curPly_1.side === 1) {
                    rsTotals.redRSPoints = rsTotals.redRSPoints + rsTotals.tmpRSPoints;
                    mesg_1 = "You have been awarded: " + rsTotals.tmpRSPoints + " Points, Total Red RS Points: " + rsTotals.redRSPoints;
                    rsTotals.tmpRSPoints = 0;
                }
                if (curPly_1.side === 2) {
                    rsTotals.blueRSPoints = rsTotals.blueRSPoints + rsTotals.tmpRSPoints;
                    mesg_1 = "You have been awarded: " + rsTotals.tmpRSPoints + " Points, Total Blue RS Points: " + rsTotals.blueRSPoints;
                    rsTotals.tmpRSPoints = 0;
                }
                srvPlayerTable.updateOne({ _id: obj._id }, { $set: rsTotals }, function (updateErr) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    console.log("aplyT2R: ", curPly_1.name, mesg_1);
                    DCSLuaCommands.sendMesgToGroup(obj.groupId, mesg_1, "15");
                    resolve();
                });
            }
            else {
                resolve("line 265: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsUnitAddToRealScore = function (obj) {
    return new Promise(function (resolve, reject) {
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            if (err) {
                reject(err);
            }
            if (serverObj.length !== 0) {
                var mesg_2;
                var curPly_2 = _.first(serverObj);
                var addScore_1 = obj.score || 0;
                var curType = obj.unitType || "";
                var tObj_1 = {};
                if (obj.unitCoalition === curPly_2.side) {
                    if (curPly_2.side === 1) {
                        mesg_2 = "You have been awarded " + addScore_1 + " from your " + curType + " for red";
                        tObj_1.redRSPoints = (curPly_2.redRSPoints || 0) + addScore_1;
                    }
                    if (curPly_2.side === 2) {
                        mesg_2 = "You have been awarded " + addScore_1 + " from your " + curType + " for blue";
                        tObj_1.blueRSPoints = (curPly_2.blueRSPoints || 0) + addScore_1;
                    }
                    srvPlayerTable.updateOne({ _id: obj._id }, { $set: tObj_1 }, function (updateErr) {
                        if (updateErr) {
                            reject(updateErr);
                        }
                        console.log(obj.unitType + " has given " + addScore_1 +
                            " to " + curPly_2.name + " on " + curPly_2.side + ", Total: ", tObj_1);
                        if (constants.config.inGameHitMessages) {
                            DCSLuaCommands.sendMesgToGroup(obj.groupId, mesg_2, "15");
                        }
                        resolve();
                    });
                }
            }
            else {
                resolve("line 315: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsAddMinutesPlayed = function (obj) {
    return new Promise(function (resolve, reject) {
        var sessionMinutesVar = "currentSessionMinutesPlayed_" + constants.side[obj.side];
        srvPlayerTable.find({ _id: obj._id }, function (err, serverObj) {
            var _a;
            if (err) {
                reject(err);
            }
            if (serverObj.length > 0) {
                var curPlayer = _.first(serverObj);
                console.log("Name: ", curPlayer.name, (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0));
                srvPlayerTable.updateOne({ _id: obj._id }, { $set: (_a = {}, _a[sessionMinutesVar] = (curPlayer.sessionMinutesVar || 0) + (obj.minutesPlayed || 0), _a) }, function (updateErr) {
                    if (updateErr) {
                        reject(updateErr);
                    }
                    resolve();
                });
            }
            else {
                resolve("line 341: no players for id: " + obj._id);
            }
        });
    });
};
exports.srvPlayerActionsResetMinutesPlayed = function (obj) {
    return new Promise(function (resolve, reject) {
        var _a;
        var sessionMinutesVar = "currentSessionMinutesPlayed_" + constants.side[obj.side];
        srvPlayerTable.updateOne({ _id: obj._id }, { $set: (_a = {}, _a[sessionMinutesVar] = 0, _a) }, function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};
