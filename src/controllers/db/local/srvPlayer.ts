/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../../typings";
import { dbModels } from "../common";
import * as ddcsController from "../../";
import {I18nResolver} from "i18n-ts";
import { engineCache } from "src/controllers/constants";

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

export async function srvPlayerActionsUpdateacquisitionsUnpacked(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const engineCache = ddcsController.getEngineCache();
        if (!obj.gciAllowed && obj.acquisitionsUnpacked == (engineCache.config.tacCommAccessAcqCount - 1)){
            dbModels.srvPlayerModel.updateOne(
                {_id: obj._id},
                {$set: { gciAllowed: true}},
                (err: any) => {
                    if (err) { reject(err); }
                    resolve();
                }
            );
        }
        
        dbModels.srvPlayerModel.updateOne(
            {_id: obj._id},
            {$inc: { acquisitionsUnpacked: 1}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function srvPlayerActionsUpdateFromServer(obj: {
    redWarBonds: number;
    blueWarBonds: number;
    tmpWarBonds: number;
    _id: string,
    sessionName: string,
    side: number,
    sideLockTime: number,
    playerId: string,
    curLifePoints?: number,
    currentSessionMinutesPlayed_blue?: number,
    currentSessionMinutesPlayed_red?: number,
    ipaddr?: string,
    sideLock?: number
}): Promise<void> {
    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, async (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            if (serverObj.length === 0) {
                // new player detected
                //console.log("player: ", obj);

                if (obj.ipaddr === ":10308") {
                    obj.ipaddr = "127.0.0.1";
                }
                obj.curLifePoints = engineCache.config.startLifePoints;

                const sObj = new dbModels.srvPlayerModel(obj);
                sObj.save((saveErr: any) => {
                    if (saveErr) { reject(saveErr); }
                    resolve();
                });
            } else {
                // existing player record exist
                const curPly = serverObj[0];

                // keep an eye on this check....
                await ddcsController.protectSlots(curPly, obj.side, obj.playerId);

                // const iUnit = await ddcsController.unitActionRead({playername: curPly.name});

                if (curPly.sessionName && obj.sessionName && (curPly.sessionName !== obj.sessionName)) {
                    obj.curLifePoints = engineCache.config.startLifePoints;
                    obj.currentSessionMinutesPlayed_blue = 0;
                    obj.currentSessionMinutesPlayed_red = 0;
                    obj.tmpWarBonds = 0;
                }
                if (obj.ipaddr === ":10308") {
                    obj.ipaddr = "127.0.0.1";
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
    groupId?: number,
    addLifePoints?: number,
    execAction?: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            const engineCache = ddcsController.getEngineCache();
            const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
            const addPoints: number = (obj.addLifePoints) ? obj.addLifePoints : serverObj[0].cachedRemovedLPPoints;
            const curAction: string = "addLifePoint";
            const curPlayerLifePoints: number = serverObj[0].curLifePoints || 0;
            const curTotalPoints: number = (curPlayerLifePoints >= 0) ? curPlayerLifePoints + addPoints : addPoints;
            const maxLimitedPoints: number = (curTotalPoints > ddcsController.maxLifePoints) ?
                ddcsController.maxLifePoints : curTotalPoints;
            let message: string;
            // console.log("OBJ: ", obj, addPoints, maxLimitedPoints);
            if (serverObj.length > 0) {
                const setObj = {
                    cachedRemovedLPPoints: (!obj.addLifePoints) ?  0 : serverObj[0].cachedRemovedLPPoints,
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
                            message = i18n.PERIODICLIFEPOINTADD
                                .replace("#1", _.round(addPoints, 2)).replace("#2", _.round(maxLimitedPoints, 2));
                        } else {
                            message = i18n.ADDWARBONDS.replace("#1", srvPlayer.name)
                                .replace("#2", addPoints).replace("#3", obj.execAction).replace("#4", _.round(maxLimitedPoints, 2));
                        }
                        // console.log("MESG: ", msg);
                        if (obj.groupId) {
                            ddcsController.sendMesgToGroup(serverObj[0], obj.groupId, message, 5);
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
            const engineCache = ddcsController.getEngineCache();
            const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
            const removePoints = obj.removeLifePoints;
            const curAction = "removeLifePoints";
            const curPlayerLifePoints = serverObj[0].curLifePoints || 0;
            const curTotalPoints = curPlayerLifePoints - removePoints;
            const maxLimitedPoints = (curTotalPoints > ddcsController.maxLifePoints) ? ddcsController.maxLifePoints : curTotalPoints;
            if (err) { reject(err); }
            if (serverObj.length > 0 && serverObj[0].playerId) {
                if (curTotalPoints < 0) {
                    const message = i18n.REMOVEPOINTSNOPOINTS.replace("#1", removePoints).replace("#2", curPlayerLifePoints.toFixed(2));
                    ddcsController.forcePlayerSpectator(serverObj[0].playerId, message);
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
                            const message = i18n.PLAYERHASJUSTUSEDLIFEPOINTS.replace("#1", serverObj[0].name)
                                .replace("#2", removePoints).replace("#3", obj.execAction).replace("#4", curTotalPoints.toFixed(2));
                            ddcsController.sendMesgToGroup(serverObj[0], obj.groupId, message, 5);
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

export async function srvPlayerSpendLifePoints(
    _id: string,
    groupId: number,
    removeLifePoints: number,
    execAction?: string
    ): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: _id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            const engineCache = ddcsController.getEngineCache();
            const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
            const removePoints = removeLifePoints;
            const curAction = "removeLifePoints";
            const curPlayerLifePoints = serverObj[0].curLifePoints || 0;
            const curTotalPoints = curPlayerLifePoints - removePoints;
            if (err) { reject(err); }
            if (serverObj.length > 0 && serverObj[0].playerId) {
                    const setObj = {
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                    };
                    dbModels.srvPlayerModel.findOneAndUpdate(
                        {_id: _id},
                        { $set: setObj },
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            const message = i18n.PLAYERHASJUSTUSEDLIFEPOINTS.replace("#1", serverObj[0].name)
                                .replace("#2", removePoints).replace("#3", execAction).replace("#4", curTotalPoints.toFixed(2));
                            ddcsController.sendMesgToGroup(serverObj[0], groupId, message, 5);
                            resolve();
                        }
                    );
                
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
                const engineCache = ddcsController.getEngineCache();
                const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: {tmpWarBonds: 0}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        ddcsController.sendMesgToGroup(serverObj[0], obj.groupId, i18n.YOURTEMPSCOREHASBEENCLEARED, 15);
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
    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
                const newTmpScore = (serverObj[0].tmpWarBonds || 0) + (obj.score || 0);
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: {tmpWarBonds: newTmpScore}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        if (engineCache.config.inGameHitMessages) {
                            ddcsController.sendMesgToGroup(serverObj[0], obj.groupId, i18n.ADDTEMPWARBONDSSCORE, 15);
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
    groupId?: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                const engineCache = ddcsController.getEngineCache();
                const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
                let message: string;
                const curPly = serverObj[0];
                const rsTotals = {
                    redWarBonds: curPly.redWarBonds || 0,
                    blueWarBonds: curPly.blueWarBonds || 0,
                    tmpWarBonds: curPly.tmpWarBonds || 0
                };
                if (curPly.side === 1) {
                    rsTotals.redWarBonds = rsTotals.redWarBonds + rsTotals.tmpWarBonds;
                    message = i18n.AWARDEDWARBONDS.replace("#1", rsTotals.tmpWarBonds)
                        .replace("#2", "Red").replace("#3", rsTotals.redWarBonds);
                    rsTotals.tmpWarBonds = 0;
                }
                if (curPly.side === 2) {
                    rsTotals.blueWarBonds = rsTotals.blueWarBonds + rsTotals.tmpWarBonds;
                    message = i18n.AWARDEDWARBONDS.replace("#1", rsTotals.tmpWarBonds)
                        .replace("#2", "Blue").replace("#3", rsTotals.blueWarBonds);
                    rsTotals.tmpWarBonds = 0;
                }
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: rsTotals},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        // console.log("aplyT2R: ", curPly.name, mesg);
                        if (obj.groupId) {
                            ddcsController.sendMesgToGroup(curPly, obj.groupId, message, 15);
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

export async function srvPlayerActionsUnitAddToRealScore(obj: {
    _id: string,
    unitCoalition: number,
    groupId?: number,
    score?: number,
    unitType?: string
}): Promise<void> {
    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                let message: string;
                const curPly = serverObj[0];
                const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
                const addScore = obj.score || 0;
                const curType = obj.unitType || "";
                const tObj: any = {};
                if (obj.unitCoalition === curPly.side) {
                    if (curPly.side === 1) {
                        message = i18n.AWARDEDWARBONDSFROMUNIT.replace("#1", addScore).replace("#2", curType).replace("#3", "red");
                        tObj.redWarBonds = (curPly.redWarBonds || 0) + addScore;
                    }
                    if (curPly.side === 2) {
                        message = i18n.AWARDEDWARBONDSFROMUNIT.replace("#1", addScore).replace("#2", curType).replace("#3", "blue");
                        tObj.blueWarBonds = (curPly.blueWarBonds || 0) + addScore;
                    }
                    dbModels.srvPlayerModel.updateOne(
                        {_id: obj._id},
                        {$set: tObj},
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            console.log(obj.unitType + " has given " + addScore +
                                " to " + curPly.name + " on " + curPly.side + ", Total: ", tObj);
                            if (engineCache.config.inGameHitMessages && !!obj.groupId) {
                                ddcsController.sendMesgToGroup(curPly, obj.groupId, message, 15);
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
        dbModels.srvPlayerModel.findOne({ _id: obj._id }, (err: any, curPlayer: any) => {
                if (err) { reject(err); }
                console.log("Name: ", curPlayer.name, (curPlayer[sessionMinutesVar] || 0) + (obj.minutesPlayed || 0));
                dbModels.srvPlayerModel.updateOne(
                    { _id: obj._id },
                    { $set: { [sessionMinutesVar]: (curPlayer[sessionMinutesVar] || 0) + (obj.minutesPlayed || 0) } },
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        resolve();
                    }
                );
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

export async function srvPlayerActionsUnsetCampaign(): Promise<void> {
    const serverCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.updateMany(
            {},
            {$set: {
                curLifePoints: serverCache.config.startLifePoints,
                sideLock: 0
               // redWarBonds: 0,
                //blueWarBonds: 0,
                //tmpWarBonds: 0
            }},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}
