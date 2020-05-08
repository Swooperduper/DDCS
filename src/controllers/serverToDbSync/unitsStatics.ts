/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export let lockUpdates = false;

export function setLockUpdates(flag: boolean) {
    lockUpdates = flag;
}

export async function processUnitUpdates(sessionName: string, unitObj: ddcsController.IUnitPayload): Promise<void> {
    if (!exports.lockUpdates) {
        const unit = await ddcsController.unitActionRead({_id: unitObj.data.name});
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
                const isAllowedToDrive = (stParse[5] === "true");
                curData = {
                    ...curData,
                    playerOwnerId: stParse[1],
                    proxChkGrp: stParse[3],
                    playerCanDrive: isAllowedToDrive
                };
            }

            // update location of carrier in aircraft DB
            if (_.includes(curData.name, "Carrier")) {
                await ddcsController.baseActionUpdate({_id: curUnitName, centerLoc: curData.lonLatLoc});
            }

            if ((!_.isEmpty(curUnit) && unitObj.action !== "D")) {
                iCurObj = {
                    action: "U",
                    sessionName,
                    data: {
                        _id: curData.name,
                        alt: curData.alt,
                        agl: curData.agl,
                        dead: false,
                        hdg: curData.hdg,
                        groupId: curData.groupId,
                        inAir: curData.inAir,
                        name: curData.name,
                        lonLatLoc: curData.lonLatLoc,
                        playername: curData.playername,
                        speed: curData.speed,
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
                await ddcsController.unitActionUpdate(iCurObj.data);
                await ddcsController.sendToCoalition({payload: {
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
                    }});
                if (curData.category === "STRUCTURE") {
                    await ddcsController.setUnitMark(curData);
                }
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
                    await ddcsController.unitActionSave(iCurObj.data);
                    await ddcsController.sendToCoalition({payload: {
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
                            }}});
                    if (curData.category === "STRUCTURE") {
                        // console.log('SUM: ', curData);
                        await ddcsController.setUnitMark(curData);
                    }
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

                    await ddcsController.unitActionUpdate(iCurObj.data);
                    iCurObj.data.coalition = iCurObj.data.coalition || curUnit.coalition;
                    if (iCurObj.data.coalition) {
                        // console.log('get side: ', _.get(iCurObj, 'data.coalition'));
                        ddcsController.sendToCoalition({payload: _.cloneDeep(iCurObj)});
                    }
                } else {
                    console.log("is not a number: ", curData.unitId, curData);
                }
            }
        }
    }
}
