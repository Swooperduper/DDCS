/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
// import * as taskController from "../action/task";
import * as webPushCommands from "../socketIO/webPush";
import * as menuUpdateController from "../menu/menuUpdate";
import * as f10MarksController from "../action/f10Marks";
import {flatMap} from "tslint/lib/utils";

export let lockUpdates = false;

export function setLockUpdates(flag: boolean) {
    lockUpdates = flag;
}

export async function processUnitUpdates(sessionName: string, unitObj: any) {
    if (!exports.lockUpdates) {
        masterDBController.unitActionRead({_id: unitObj.data.name})
            .then((unit: any) => {
                let stParse;
                let iCurObj: any;
                const curUnit = unit[0];
                const curUnitName = curUnit.name;
                let curData = unitObj.data;
                if (!_.includes(curData.name, "New Static Object")) {
                    // build out extra info on spawned items isAI
                    if (_.includes(curData.name, "AI|")) {
                        stParse = _.split(curData.name, "|");
                        curData = {
                            ...curData,
                            playerOwnerId: stParse[1],
                            isAI: true,
                            hidden: true
                        };
                    }
                    if (_.includes(curData.name, "TU|")) {
                        stParse = _.split(curData.name, "|");
                        curData = {
                            ...curData,
                            playerOwnerId: stParse[1],
                            playerCanDrive: false,
                            isTroop: true,
                            spawnCat: stParse[2]
                        };
                    }
                    if (_.includes(curData.name, "CU|")) {
                        stParse = _.split(curData.name, "|");
                        curData = {
                            ...curData,
                            playerOwnerId: stParse[1],
                            isCombo: _.isBoolean(stParse[5]),
                            playerCanDrive: false,
                            isCrate: true,
                            hidden: false
                        };
                    }
                    if (_.includes(curData.name, "DU|")) {
                        stParse = _.split(curData.name, "|");
                        curData = {
                            ...curData,
                            playerOwnerId: stParse[1],
                            proxChkGrp: stParse[3],
                            playerCanDrive: stParse[5]
                        };
                    }

                    // update location of carrier in aircraft DB
                    if (_.includes(curData.name, "Carrier")) {
                        masterDBController.baseActionUpdate({_id: curUnitName, centerLoc: curData.lonLatLoc});
                    }

                    if (curData.playername && (unitObj.action === "C")) {
                        // menuUpdateController.logisticsMenu("resetMenu", unitObj.data);
                    }

                    /*
                    //set ewr task to ewr if new
                                    if (curUnit.type === '1L13 EWR' || curUnit.type === '55G6 EWR' || curUnit.type === 'Dog Ear radar') {
                                            if (!_.get(taskController, ['ewrUnitsActivated', curUnitName], false)) {
                                                    console.log('Set ewr for: ', curUnitName );
                                                    taskController.setEWRTask(serverName, curUnitName);
                                                    _.set(taskController, ['ewrUnitsActivated', curUnitName], true);
                                            }
                                    }
                                    */

                    if ((!_.isEmpty(curUnit) && unitObj.action !== "D")) {
                        // console.log('updateIDs: ', _.get(curData, 'unitId'));
                        iCurObj = {
                            action: "U",
                            sessionName,
                            data: {
                                _id: curData.name,
                                alt: parseFloat(curData.alt),
                                agl: parseFloat(curData.agl),
                                dead: false,
                                hdg: parseFloat(curData.hdg),
                                groupId: curData.groupId,
                                inAir: curData.inAir,
                                name: curData.name,
                                lonLatLoc: curData.lonLatLoc,
                                playername: curData.playername,
                                speed: parseFloat(curData.speed),
                                unitId: curData.unitId
                            }
                        };
                        if (curData.type) {
                            iCurObj.data.type = curData.type;
                        }
                        if (curData.ammo) {
                            iCurObj.data.ammo = curData.ammo;
                        }
                        if (curData.coalition) {
                            iCurObj.data.coalition = curData.coalition;
                        } else {
                            iCurObj.data.coalition = curUnit.coalition;
                        }
                        if (curData.country) {
                            iCurObj.data.country = curData.country;
                        }
                        masterDBController.unitActionUpdate(iCurObj.data)
                            .then(() => {
                                const sObj = {
                                    action: "U",
                                    data: {
                                        _id: iCurObj.data._id,
                                        lonLatLoc: iCurObj.data.lonLatLoc,
                                        alt: iCurObj.data.alt,
                                        agl: iCurObj.data.agl,
                                        hdg: iCurObj.data.hdg,
                                        speed: iCurObj.data.speed,
                                        coalition: iCurObj.data.coalition
                                    }
                                };
                                webPushCommands.sendToCoalition({payload: sObj});
                                if (curData.category === "STRUCTURE") {
                                    // console.log('SUM: ', curData);
                                    f10MarksController.setUnitMark(curData);
                                }
                            })
                            .catch((err: any) => {
                                console.log("update err line626: ", err);
                            });
                    } else if (unitObj.action === "C") {
                        if (curData.name) {
                            curData._id = curData.name;
                            iCurObj = {
                                action: "C",
                                sessionName,
                                data: curData
                            };
                            if (curData.category === "STRUCTURE") {
                                if ( _.includes(curData.name, " Logistics")) {
                                    curData.proxChkGrp = "logisticTowers";
                                }
                            }
                            masterDBController.unitActionSave(iCurObj.data)
                                .then(() => {
                                    const sObj = {
                                        action: "C",
                                        data: {
                                            _id: iCurObj.data._id,
                                            lonLatLoc: iCurObj.data.lonLatLoc,
                                            alt: iCurObj.data.alt,
                                            agl: iCurObj.data.agl,
                                            hdg: iCurObj.data.hdg,
                                            speed: iCurObj.data.speed,
                                            coalition: iCurObj.data.coalition,
                                            type: iCurObj.data.type,
                                            playername: iCurObj.data.playername,
                                            playerOwnerId: iCurObj.data.playerOwnerId
                                        }
                                    };
                                    webPushCommands.sendToCoalition({payload: sObj});
                                    if (curData.category === "STRUCTURE") {
                                        // console.log('SUM: ', curData);
                                        f10MarksController.setUnitMark(curData);
                                    }
                                })
                                .catch((err) => {
                                    console.log("save err line95: ", err, iCurObj.data);
                                })
                            ;
                        }
                    } else if (unitObj.action === "D") {
                        if (curData.name) {
                            iCurObj = {
                                action: "D",
                                sessionName,
                                data: {
                                    _id: curData.name,
                                    name: curData.name,
                                    troopType: null,
                                    intCargoType: null,
                                    virtCrateType: null,
                                    dead: true
                                }
                            };

                            if (curData.coalition) {
                                iCurObj.data.coalition = curData.coalition;
                            }

                            masterDBController.unitActionUpdate(iCurObj.data)
                                .then(() => {
                                    iCurObj.data.coalition = iCurObj.data.coalition || curUnit.coalition;
                                    if (iCurObj.data.coalition) {
                                        // console.log('get side: ', _.get(iCurObj, 'data.coalition'));
                                        webPushCommands.sendToCoalition({payload: _.cloneDeep(iCurObj)});
                                    }
                                    // curServers[serverName].updateQue.q1.push(_.cloneDeep(iCurObj));
                                    // curServers[serverName].updateQue.q2.push(_.cloneDeep(iCurObj));
                                    // curServers[serverName].updateQue.qadmin.push(_.cloneDeep(iCurObj));
                                })
                                .catch((err) => {
                                    console.log("del err line123: ", err);
                                })
                            ;
                        } else {
                            console.log("is not a number: ", curData.unitId, curData);
                        }
                    }
                }
            })
            .catch((err: any) => {
                console.log("err line129: ", err);
            });
    }
}
