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
    redRSPoints: number;
    blueRSPoints: number;
    tmpRSPoints: number;
    _id: string,
    sessionName: string,
    side: number,
    sideLockTime: number,
    playerId: string,
    warbonds?: number,
    tmpWarbonds?:number,
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
                obj.warbonds = engineCache.config.startWarbonds;

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
                    //obj.warbonds = engineCache.config.startWarbonds;
                    obj.tmpWarbonds = 0;
                    obj.currentSessionMinutesPlayed_blue = 0;
                    obj.currentSessionMinutesPlayed_red = 0;
                    //obj.tmpRSPoints = 0;
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

export async function srvPlayerActionsAddWarbonds(obj: {
    _id: string,
    groupId?: number,
    addWarbonds?: number,
    execAction?: string,
    numberOfFactories?: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            const engineCache = ddcsController.getEngineCache();
            const addPoints: number = (obj.addWarbonds) ? obj.addWarbonds : 0;;
            const curAction: string = "addWarbonds";
            const curPlayerWarbonds: number = serverObj[0].warbonds || 0;
            console.log("serverObj[0].warbonds:",serverObj[0].warbonds, "\n","serverObj[0]:",serverObj[0])
            const curTotalPoints: number = Math.round(curPlayerWarbonds) + Math.round(addPoints);
            let message: string;
            let setObj: any;
            console.log("Adding Warbonds to",obj._id);
            if (serverObj.length > 0) {
                if (obj.execAction == "Land"){
                    let setObj = {
                        warbonds: curTotalPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs,
                        takeOffCostDeducted: false
                    };
                    if(setObj.warbonds = Infinity){
                        console.log("ERROR-INFWB Warbonds for infinity found in setObj, line 159 , crvPlayer.ts")
                        setObj = {
                            warbonds: 2000,
                            lastLifeAction: curAction,
                            safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs,
                            takeOffCostDeducted: false
                        };
                    }
                }else{
                    let setObj = {
                        warbonds: curTotalPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                    };
                    if(setObj.warbonds = Infinity){
                        console.log("ERROR-INFWB Warbonds for infinity found in setObj, line 175 , crvPlayer.ts")
                        setObj = {
                            warbonds: 2000,
                            lastLifeAction: curAction,
                            safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                        };
                    }
                }
                dbModels.srvPlayerModel.findOneAndUpdate(
                    {_id: obj._id},
                    { $set: setObj },
                    (updateErr: any, srvPlayer: typings.ISrvPlayers) => {
                        if (updateErr) { reject(updateErr); }
                        if (obj.execAction === "PeriodicAdd" && obj.numberOfFactories !== undefined) {
                            message = "You have gained "+addPoints+" Warbonds and now have a total of "+curTotalPoints+" Warbonds.\n" + 
                            "You currently have (" + obj.numberOfFactories +"/"+ engineCache.config.maxCoaltionFactories + ") functional factories and gained an additional income of " +(obj.numberOfFactories * engineCache.config.factoryWarbondIncome)+" Warbonds as a result"
                        } else {
                            message = "You have gained "+addPoints+" Warbonds and now have a total of "+curTotalPoints+" Warbonds"
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


export async function srvPlayerActionsRemoveWarbonds(obj: {
    _id: string,
    groupId: number,
    removeWarbonds: number,
    execAction?: string,
    storePoints?: boolean
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            const engineCache = ddcsController.getEngineCache();
            const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
            const removePoints = obj.removeWarbonds;
            const curAction = "removeWarbonds";
            console.log("serverObj[0].warbonds:",serverObj[0].warbonds, "\n","serverObj[0]:",serverObj[0])
            const curPlayerWarbonds = serverObj[0].warbonds || 0;
            let curTotalPoints = curPlayerWarbonds - removePoints;
            if(curTotalPoints < 0){
                curTotalPoints = 0
            }
            if (err) { reject(err); }
            if (serverObj.length > 0 && serverObj[0].playerId) {
                if (curTotalPoints < 0) {
                    const message = i18n.REMOVEPOINTSNOPOINTS.replace("#1", removePoints).replace("#2", curPlayerWarbonds.toFixed(2));
                    ddcsController.forcePlayerSpectator(serverObj[0].playerId, message);
                    resolve();
                } else {
                    let setObj: any;
                    if(obj.execAction == "Takeoff"){
                    setObj = {
                        warbonds: curTotalPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs,
                        takeOffCostDeducted: true
                    }
                    if(setObj.warbonds = Infinity){
                        console.log("ERROR-INFWB Warbonds for infinity found in setObj, line 242 , crvPlayer.ts")
                        setObj = {
                            warbonds: 2000,
                            lastLifeAction: curAction,
                            safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs,
                            takeOffCostDeducted: true
                        }
                    }
                    }else{
                    setObj = {
                        warbonds: curTotalPoints,
                        lastLifeAction: curAction,
                        safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                    };
                    if(setObj.warbonds = Infinity){
                        console.log("ERROR-INFWB Warbonds for infinity found in setObj, line 258 , crvPlayer.ts")
                        setObj = {
                            warbonds: 2000,
                            lastLifeAction: curAction,
                            safeLifeActionTime: new Date().getTime() + ddcsController.time.fifteenSecs
                        };
                    }
                    }
                    dbModels.srvPlayerModel.findOneAndUpdate(
                        {_id: obj._id},
                        { $set: setObj },
                        (updateErr: any) => {
                            if (updateErr) { reject(updateErr); }
                            let message = "You Have Just Used "+removePoints+ " Warbonds! "+obj.execAction+"(Total:"+curTotalPoints.toFixed(2)+")";
                            if(obj.execAction == "Friendly Fire"){
                                message = "You Have Just Lost "+removePoints+ " Warbonds due to "+obj.execAction+"(Total:"+curTotalPoints.toFixed(2)+")";
                            }else if(obj.execAction == "unpackedUnits"){
                                message = "You Have Just Spent "+removePoints+ " Warbonds on unpacking units.(Total:"+curTotalPoints.toFixed(2)+")";
                            }
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
    removeWarbonds: number,
    execAction?: string
    ): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: _id}, (err: any, serverObj: typings.ISrvPlayers[]) => {
            const engineCache = ddcsController.getEngineCache();
            const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
            const removePoints = removeWarbonds;
            const curAction = "removeLifePoints";
            const warbonds = serverObj[0].warbonds || 0;
            const curTotalPoints = warbonds - removePoints;
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

export async function srvPlayerActionsClearTempWarbonds(obj: {
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
                    {$set: {tmpWarbonds: 0, takeOffCostDeducted: false}},
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
                    redRSPoints: curPly.redRSPoints || 0,
                    blueRSPoints: curPly.blueRSPoints || 0,
                    tmpRSPoints: curPly.tmpRSPoints || 0
                };
                if (curPly.side === 1) {
                    rsTotals.redRSPoints = rsTotals.redRSPoints + rsTotals.tmpRSPoints;
                    message = i18n.AWARDEDRSPOINTS.replace("#1", rsTotals.tmpRSPoints)
                        .replace("#2", "Red").replace("#3", rsTotals.redRSPoints);
                    rsTotals.tmpRSPoints = 0;
                }
                if (curPly.side === 2) {
                    rsTotals.blueRSPoints = rsTotals.blueRSPoints + rsTotals.tmpRSPoints;
                    message = i18n.AWARDEDRSPOINTS.replace("#1", rsTotals.tmpRSPoints)
                        .replace("#2", "Blue").replace("#3", rsTotals.blueRSPoints);
                    rsTotals.tmpRSPoints = 0;
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
                        message = i18n.AWARDEDRSPOINTSFROMUNIT.replace("#1", addScore).replace("#2", curType).replace("#3", "red");
                        tObj.redRSPoints = (curPly.redRSPoints || 0) + addScore;
                    }
                    if (curPly.side === 2) {
                        message = i18n.AWARDEDRSPOINTSFROMUNIT.replace("#1", addScore).replace("#2", curType).replace("#3", "blue");
                        tObj.blueRSPoints = (curPly.blueRSPoints || 0) + addScore;
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

export async function srvPlayerActionsApplyTempToRealWarbonds(obj: {
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
                    warbonds: curPly.warbonds || 0,
                    tmpWarbonds: curPly.tmpWarbonds || 0
                };

                rsTotals.warbonds = rsTotals.warbonds + rsTotals.tmpWarbonds;
                if(rsTotals.warbonds = Infinity){
                    console.log("ERROR-INFWB Warbonds for infinity found in rsTotals.warbonds, line 473 , srvPlayer.ts")
                    rsTotals.warbonds = 2000
                }
                message = i18n.AWARDEDRSPOINTS.replace("#1", rsTotals.tmpWarbonds)
                    .replace("#2", "Red").replace("#3", rsTotals.warbonds);
                rsTotals.tmpWarbonds = 0;
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

export async function srvPlayerActionsAddTempWarbonds(obj: {
    _id: string,
    groupId: number
    score?: number
}): Promise<void> {
    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: obj._id}, (err: any, serverObj: any[]) => {
            if (err) { reject(err); }
            if (serverObj.length !== 0) {
                console.log("score:",obj.score)
                const i18n = new I18nResolver(engineCache.i18n, serverObj[0].lang).translation as any;
                const newtmpWarbonds = (serverObj[0].tmpWarbonds || 0) + (obj.score || 0);
                dbModels.srvPlayerModel.updateOne(
                    {_id: obj._id},
                    {$set: {tmpWarbonds: newtmpWarbonds}},
                    (updateErr: any) => {
                        if (updateErr) { reject(updateErr); }
                        if (engineCache.config.inGameHitMessages) {
                            ddcsController.sendMesgToGroup(serverObj[0], obj.groupId, "TmpScore: "+newtmpWarbonds+", Land at a friendly base/farp to receive these War Bonds!", 15);
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

export async function srvPlayerActionsUnitAddToWarbonds(obj: {
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
                console.log("Score to add:",obj.score)
                let message: string;
                const curPly = serverObj[0];
                const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
                const addScore = obj.score || 0;
                console.log("addScore:",obj.score)
                const curType = obj.unitType || "";
                const tObj: any = {};
                if (obj.unitCoalition === curPly.side) {
                    message = i18n.AWARDEDRSPOINTSFROMUNIT.replace("#1", addScore).replace("#2", curType).replace("#3", "red");
                    console.log(curPly.warbonds,"+",addScore)
                    tObj.warbonds = (curPly.warbonds || 0) + addScore;
                    console.log(curPly.warbonds,"+",addScore,"=",tObj.warbonds)
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

export async function srvPlayerActionsResettmpWarbonds(obj: {
    _id: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.updateOne(
            {_id: obj._id},
            {$set: {tmpWarbonds: 0}},
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
                warbonds: serverCache.config.startWarbonds,
                tmpWarbonds: 0,
                sideLock: 0
               // redRSPoints: 0,
                //blueRSPoints: 0,
                //tmpRSPoints: 0
            }},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}
