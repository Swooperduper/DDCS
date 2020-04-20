/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

// Occurs whenever an object is hit by a weapon.
// arg1 = id
// arg2 = time
// arg3 = initiatorId
// arg4 = targetId
// arg7 = WeaponId

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as webPushCommands from "../../socketIO/webPush";
import * as radioTowerController from "../../action/radioTower";

export const shootingUsers = {};

export async function checkShootingUsers() {
    const nowTime = new Date().getTime();
    if (_.keys(exports.shootingUsers).length > 0) {
        _.forEach(exports.shootingUsers, (user, key) => {
            if (user.startTime + 3000 < new Date().getTime()) {
                const shootObj = user.iCurObj;
                // _.set(shootObj, 'score', _.get(exports.shootingUsers, [key, 'count'], 1));
                // if (shootObj.score === 1) {
                shootObj.score = 10;
                // }
                if (shootObj.iucid || shootObj.tucid) {
                    webPushCommands.sendToAll({payload: {action: "S_EVENT_HIT", data: _.cloneDeep(shootObj)}});
                    masterDBController.simpleStatEventActionsSave(shootObj);
                }
                if (exports.shootingUsers[key].isOwnedUnit) {
                    masterDBController.srvPlayerActionsUnitAddToRealScore({
                        _id: shootObj.iOwnerId,
                        groupId: shootObj.groupId,
                        score: shootObj.score,
                        unitType: shootObj.iType,
                        unitCoalition: shootObj.iUnitCoalition
                    })
                        .catch((err) => {
                            console.log("line33", err);
                        });
                } else {
                    masterDBController.srvPlayerActionsAddTempScore({_id: shootObj.iucid, groupId: shootObj.groupId, score: shootObj.score})
                        .catch((err) => {
                            console.log("line39", err);
                        });
                }
                if (shootObj.tUnit.category === "GROUND") {
                    radioTowerController.baseUnitUnderAttack(shootObj.tUnit);
                    if (constants.config.inGameHitMessages) {
                        console.log("shooting1: ", shootObj.msg);
                        DCSLuaCommands.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + constants.time.oneMin
                        );
                    }
                } else if (shootObj.iUnit.category === "GROUND") {
                    radioTowerController.baseUnitUnderAttack(shootObj.tUnit);
                    if (constants.config.inGameHitMessages || exports.shootingUsers[key].isOwnedUnit) {
                        console.log("shooting2: ", shootObj.msg);
                        DCSLuaCommands.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + constants.time.oneMin
                        );
                    }
                } else {
                    if (constants.config.inGameHitMessages) {
                        console.log("shooting3: ", shootObj.msg);
                        DCSLuaCommands.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + constants.time.oneMin
                        );
                    }
                }
                delete exports.shootingUsers[key];
            }
        });
    }
}

export async function processEventHit(sessionName: string, eventObj: any) {
    const iUnitId = eventObj.data.arg3;
    const tUnitId = eventObj.data.arg4;
    let iPName: string;
    let tPName: string;
    let iCurObj: any;
    let iPlayer: any;
    let tPlayer: any;
    const nowTime = new Date().getTime();
    // console.log('hit obj: ', serverName, sessionName, eventObj);
    masterDBController.unitActionRead({unitId: iUnitId})
        .then((iunit: any) => {
            const curIUnit = iunit[0];
            masterDBController.unitActionRead({unitId: tUnitId})
                .then((tunit: any) => {
                    const curTUnit = tunit[0];
                    masterDBController.srvPlayerActionsRead({sessionName})
                        .then((playerArray: any) => {
                            let isOwnedUnit = false;
                            const oId = [];
                            const iOwnerId = curIUnit.playerOwnerId;
                            const tOwnerId = curTUnit.playerOwnerId;

                            if (iOwnerId || tOwnerId) {
                                if (iOwnerId) {
                                    oId.push(iOwnerId);
                                }
                                if (tOwnerId) {
                                    oId.push(tOwnerId);
                                }
                            }
                            masterDBController.srvPlayerActionsRead({_id: {$in: oId}})
                                .then((ownerIds: any) => {
                                    // console.log('targethit: ', _.get(curTUnit, 'unitId'));
                                    iCurObj = {
                                        sessionName,
                                        eventCode: constants.shortNames[eventObj.action],
                                        iName: curIUnit.playername,
                                        iType: curIUnit.type,
                                        iOwnerId,
                                        tName: curTUnit.playername,
                                        tOwnerId,
                                        displaySide: "A",
                                        roleCode: "I",
                                        showInChart: true,
                                        groupId: curIUnit.groupId,
                                        iCoalition: curIUnit.coalition,
                                        iUnit: curIUnit,
                                        tUnit: curTUnit
                                    };

                                    _.forEach(ownerIds, (ownerId: any) => {
                                        if (ownerId.ucid === iOwnerId) {
                                            iCurObj.iOwner = ownerId;
                                            iCurObj.iOwnerName = ownerId.name;
                                            iCurObj.iOwnerNamePretty = "(" + ownerId.name + ")";
                                        }
                                        if (ownerId.ucid === tOwnerId) {
                                            iCurObj.tOwner = ownerId;
                                            iCurObj.tOwnerName = ownerId.name;
                                            iCurObj.tOwnerNamePretty = "(" + ownerId.name + ")";
                                        }
                                    });

                                    if (curIUnit) {
                                        iPlayer = _.find(playerArray, {name: curIUnit.playername});
                                        if (iPlayer) {
                                            iCurObj.iucid = iPlayer.ucid;
                                            iPName = curIUnit.type + "(" + curIUnit.playername + ")";
                                        } else {
                                            iPName = curIUnit.type + iCurObj.iOwnerNamePretty;
                                            isOwnedUnit = true;
                                        }
                                    }

                                    if (curTUnit ) {
                                        tPlayer = _.find(playerArray, {name: curTUnit.playername});
                                        if (tPlayer) {
                                            iCurObj.tucid = tPlayer.ucid;
                                            tPName = curTUnit.type + "(" + curTUnit.playername + ")";
                                        } else {
                                            tPName = curTUnit.type + iCurObj.tOwnerNamePretty;
                                        }
                                    }

                                    if (curIUnit.coalition !== curTUnit.coalition) {
                                        const curWeapon = _.find(constants.weaponsDictionary, {_id: eventObj.data.arg7.typeName});

                                        if (curWeapon) {
                                            const curWeaponName = ( curWeapon.displayName) ?  curWeapon.displayName :  curWeapon._id;

                                            if (iCurObj.iucid || iCurObj.tucid || isOwnedUnit) {
                                                if (_.startsWith(curWeapon.name, "weapons.shells")) {
                                                    exports.shootingUsers[iUnitId].count = exports.shootingUsers[iUnitId].count + 1;
                                                    exports.shootingUsers[iUnitId].startTime = new Date().getTime();
                                                    // exports.shootingUsers[iUnitId[.serverName = serverName;
                                                    exports.shootingUsers[iUnitId].isOwnedUnit = isOwnedUnit;
                                                    exports.shootingUsers[iUnitId].iUnitType = iCurObj.iType;
                                                    exports.shootingUsers[iUnitId].iUnitCoalition = iCurObj.iCoalition;
                                                    iCurObj.msg =
                                                        constants.side[curIUnit.coalition] + " " + iPName + " has hit " +
                                                        constants.side[curTUnit.coalition] + " " + tPName + " " +
                                                        exports.shootingUsers[iUnitId].count + " times with " + curWeaponName + " - +10";

                                                    exports.shootingUsers[iUnitId].iCurObj = _.cloneDeep(iCurObj);
                                                } else {
                                                    iCurObj.score = curWeapon.score;
                                                    iCurObj.msg = constants.side[curIUnit.coalition] + " " + iPName + " has hit " +
                                                        constants.side[curTUnit.coalition] + " " + tPName + " with " + curWeaponName +
                                                        " - +" + curWeapon.score;

                                                    if (iCurObj.iucid || iCurObj.tucid) {
                                                        webPushCommands.sendToAll({payload: {
                                                            action: eventObj.action,
                                                            data: _.cloneDeep(iCurObj)
                                                        }});
                                                        masterDBController.simpleStatEventActionsSave(iCurObj);
                                                    }
                                                    if (isOwnedUnit) {
                                                        masterDBController.srvPlayerActionsUnitAddToRealScore({
                                                            _id: iCurObj.iOwnerId,
                                                            groupId: iCurObj.groupId,
                                                            score: iCurObj.score,
                                                            unitType: iCurObj.iType,
                                                            unitCoalition: iCurObj.iCoalition
                                                        })
                                                            .catch((err) => {
                                                                console.log("line147", err);
                                                            });
                                                    } else {
                                                        masterDBController.srvPlayerActionsAddTempScore({
                                                            _id: iCurObj.iucid,
                                                            groupId: iCurObj.groupId,
                                                            score: iCurObj.score
                                                        })
                                                            .catch((err) => {
                                                                console.log("line147", err);
                                                            });
                                                    }
                                                    if (iCurObj.tUnit.category === "GROUND") {
                                                        radioTowerController.baseUnitUnderAttack(iCurObj.tUnit);
                                                        if (constants.config.inGameHitMessages) {
                                                            console.log("groundhit: ", iCurObj.msg);
                                                            DCSLuaCommands.sendMesgToAll(
                                                                "A: " + iCurObj.msg,
                                                                20,
                                                                nowTime + constants.time.oneMin
                                                            );
                                                        }
                                                    } else if (iCurObj.iUnit.category === "GROUND") {
                                                        if (constants.config.inGameHitMessages || isOwnedUnit) {
                                                            console.log("groundrecievehit: ", iCurObj.msg);
                                                            DCSLuaCommands.sendMesgToAll(
                                                                "A: " + iCurObj.msg,
                                                                20,
                                                                nowTime + constants.time.oneMin
                                                            );
                                                        }
                                                    } else {
                                                        if (constants.config.inGameHitMessages) {
                                                            console.log("reg hit: ", iCurObj.msg);
                                                            DCSLuaCommands.sendMesgToAll(
                                                                "A: " + iCurObj.msg,
                                                                20,
                                                                nowTime + constants.time.oneMin
                                                            );
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            // console.log('weapon not here');
                                            console.log("Weapon Unknown: ", eventObj.data.arg7.typeName);
                                            exports.shootingUsers[iUnitId].count = exports.shootingUsers[iUnitId].count + 1;
                                            exports.shootingUsers[iUnitId].startTime = new Date().getTime();
                                            // exports.shootingUsers, [iUnitId].serverName = serverName;
                                            exports.shootingUsers[iUnitId].isOwnedUnit = isOwnedUnit;
                                            exports.shootingUsers[iUnitId].iUnitType = iCurObj.iType;
                                            exports.shootingUsers[iUnitId].iUnitCoalition = iCurObj.iCoalition;
                                            const shotCount = exports.shootingUsers[iUnitId].count;
                                            iCurObj.msg =
                                                "A: " + constants.side[curIUnit.coalition] + " " + iPName + " has hit " +
                                                constants.side[curTUnit.coalition] + " " + tPName + " " + shotCount + " times with ? - +10";

                                            exports.shootingUsers[iUnitId].iCurObj = _.cloneDeep(iCurObj);
                                        }
                                    }
                                })
                                .catch((err) => {
                                    console.log("err line170: ", err);
                                });
                        })
                        .catch((err) => {
                            console.log("err line45: ", err);
                        });
                })
                .catch((err) => {
                    console.log("err line170: ", err);
                });
        })
        .catch((err) => {
            console.log("err line182: ", err);
        });
}
