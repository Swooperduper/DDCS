/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as masterDBController from "../db";
import * as proximityController from "../proxZone/proximity";
import * as menuUpdateController from "../menu/menuUpdate";
import * as groupController from "../spawn/group";
import * as crateController from "../menu/crate";
import * as repairController from "../menu/repair";
import * as userLivesController from "../action/userLives";
import * as resourcePointsController from "../action/resourcePoints";
import * as serverTimerController from "../action/serverTimer";
import * as sideLockController from "../action/sideLock";
import * as zoneController from "../proxZone/zone";

export async function internalCargo(curUnit: any, curPlayer: any, intCargoType: string) {

    let checkAllBase: any[] = [];
    let crateObj: any;
    let crateCount: number = 0;
    let curBaseName: string;
    let curBaseObj: any;
    if (intCargoType === "loaded") {
        if (curUnit.intCargoType) {
            DCSLuaCommands.sendMesgToGroup(
                curUnit.groupId,
                "G: " + curUnit.intCargoType + " Internal Crate is Onboard!",
                5
            )
                .catch((err) => {
                    console.log("line 35: ", err);
                });
        } else {
            DCSLuaCommands.sendMesgToGroup(
                curUnit.groupId,
                "G: No Internal Crates Onboard!",
                5
            )
                .catch((err) => {
                    console.log("line 44: ", err);
                });
        }
    }
    if (intCargoType === "unpack") {
        const intCargo = _.split(curUnit.intCargoType, "|");
        const curIntCrateType = intCargo[1];
        const curIntCrateBaseOrigin = intCargo[2];
        const crateType = (curUnit.coalition === 1) ? "UAZ-469" : "Hummer";
        if (curUnit.inAir) {
            DCSLuaCommands.sendMesgToGroup(
                curUnit.groupId,
                "G: Please Land Before Attempting Cargo Commands!",
                5
         )
                .catch((err) => {
                    console.log("line 68: ", err);
                });
        } else {
            if (curIntCrateType) {
                checkAllBase = [];
                masterDBController.baseActionRead({})
                    .then((bases) => {
                        _.forEach(bases, (base) => {
                            checkAllBase.push(proximityController.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername)
                                .then((playerAtBase) => {
                                    if (playerAtBase) {
                                        curBaseObj = base;
                                    }
                                    return playerAtBase;
                                })
                                .catch((err) => {
                                    console.log("line 59: ", err);
                                })
                            );
                        });
                        Promise.all(checkAllBase)
                            .then((playerProx) => {
                                // console.log('player prox: ', playerProx, _.some(playerProx)); _.some(playerProx)
                                curBaseName = _.split(curBaseObj.name, " #")[0];
                                console.log("intCurUnpackBaseAt: ", curBaseName);
                                if (curIntCrateBaseOrigin === curBaseName) {
                                    DCSLuaCommands.sendMesgToGroup(
                                        curUnit.groupId,
                                        "G: You can't unpack this internal crate from same base it is acquired!",
                                        5
                                    );
                                } else {
                                    if (curIntCrateType === "JTAC") {
                                        exports.unpackCrate(curUnit, curUnit.country, crateType, "jtac", false, true);
                                        masterDBController.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""})
                                            .then(() => {
                                                DCSLuaCommands.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    "G: You Have Spawned A JTAC Unit From Internal Cargo!",
                                                    5
                                                );
                                            })
                                            .catch((err) => {
                                                console.log("erroring line209: ", err);
                                            })
                                        ;
                                    }
                                    if (curIntCrateType === "BaseRepair") {
                                        if (_.some(playerProx)) {
                                            repairController.repairBase(curBaseObj, curUnit);
                                        } else {
                                            DCSLuaCommands.sendMesgToGroup(
                                                curUnit.groupId,
                                                "G: You are not near any friendly bases!",
                                                5
                                            );
                                        }
                                    }
                                    if (curIntCrateType === "CCBuild") {  // serverName, curUnit, curPlayer, intCargoType
                                        constants.getServer()
                                            .then((serverInfo: any) => {
                                                masterDBController.staticCrateActionRead({playerOwnerId: curPlayer.ucid})
                                                    .then((delCrates) => {
                                                        _.forEach(delCrates, (crate) => {
                                                            if (crateCount > serverInfo.maxCrates - 2) {
                                                                masterDBController.staticCrateActionDelete({
                                                                    _id: crate._id
                                                                })
                                                                    .catch((err) => {
                                                                        console.log("erroring line573: ", err);
                                                                    })
                                                                ;
                                                                groupController.destroyUnit(crate._id);
                                                            }
                                                            crateCount++;
                                                        });
                                                        crateObj = {
                                                            name: curUnit.intCargoType + "|#" + _.random(1000000, 9999999),
                                                            unitLonLatLoc: curUnit.lonLatLoc,
                                                            shape_name: "iso_container_small_cargo",
                                                            category: "Cargo",
                                                            type: "iso_container_small",
                                                            heading: curUnit.hdg,
                                                            canCargo: true,
                                                            mass: 500,
                                                            playerOwnerId: curPlayer.ucid,
                                                            templateName: "CCBuild",
                                                            special: curUnit.intCargoType,
                                                            crateAmt: 1,
                                                            isCombo: false,
                                                            playerCanDrive: false,
                                                            country: constants.defCountrys[curUnit.coalition],
                                                            side: curUnit.coalition,
                                                            coalition: curUnit.coalition
                                                        };
                                                        crateController.spawnLogiCrate(crateObj, true);
                                                        masterDBController.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""})
                                                            .catch((err) => {
                                                                console.log("error line209: ", err);
                                                            });
                                                        DCSLuaCommands.sendMesgToGroup(
                                                            curUnit.groupId,
                                                            "G: Command Center Build crate has been spawned!",
                                                            5
                                                        );
                                                    })
                                                    .catch((err) => {
                                                        console.log("line 1359: ", err);
                                                    })
                                                ;
                                            })
                                            .catch((err) => {
                                                console.log("line 1359: ", err);
                                            })
                                        ;
                                    }
                                }
                            })
                            .catch((err) => {
                                console.log("line 26: ", err);
                            })
                        ;
                    })
                    .catch((err) => {
                        console.log("line 26: ", err);
                    })
                ;
            } else {
                DCSLuaCommands.sendMesgToGroup(
                    curUnit.groupId,
                    "G: No Internal Crates Onboard!",
                    5
                )
                    .catch((err) => {
                        console.log("line 194: ", err);
                    });
            }
        }
    }
    if (intCargoType === "loadJTAC" || intCargoType === "loadBaseRepair" || intCargoType === "loadCCBuild") {
        checkAllBase = [];
        if (curUnit.inAir) {
            DCSLuaCommands.sendMesgToGroup(
                curUnit.groupId,
                "G: Please Land Before Attempting Cargo Commands!",
                5
            )
                .catch((err) => {
                    console.log("line 288: ", err);
                });
        } else {
            masterDBController.baseActionRead({})
                .then((bases) => {
                    _.forEach(bases, (base) => {
                        checkAllBase.push(proximityController.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername)
                            .then((playerAtBase) => {
                                if (playerAtBase) {
                                    curBaseObj = base;
                                }
                                return playerAtBase;
                            })
                            .catch((err) => {
                                console.log("line 59: ", err);
                            })
                        );
                    });
                    Promise.all(checkAllBase)
                        .then((playerProx) => {
                            // console.log('playerResp: ', curBaseObj);
                            if (_.some(playerProx)) {
                                curBaseName = _.split(_.get(curBaseObj, "name"), " #")[0];
                                console.log("intCurBaseAt: ", curBaseName);
                                masterDBController.unitActionRead({name: curBaseName + " Logistics", dead: false})
                                    .then((aliveLogistics) => {
                                        if (aliveLogistics.length > 0 || _.includes(curBaseName, "Carrier")) {
                                            if (intCargoType === "loadJTAC") {
                                                masterDBController.unitActionUpdateByUnitId({
                                                    unitId: curUnit.unitId,
                                                    intCargoType: "|JTAC|" + curBaseName + "|"
                                                })
                                                    .then(() => {
                                                        DCSLuaCommands.sendMesgToGroup(
                                                            curUnit.groupId,
                                                            "G: Picked Up A JTAC Internal Crate From " + curBaseName + "!",
                                                            5
                                                        );
                                                    })
                                                    .catch((err) => {
                                                        console.log("erroring line209: ", err);
                                                    })
                                                ;
                                            }
                                            if (intCargoType === "loadBaseRepair") {
                                                masterDBController.unitActionUpdateByUnitId({
                                                    unitId: curUnit.unitId,
                                                    intCargoType: "|BaseRepair|" + curBaseName + "|"
                                                })
                                                    .then(() => {
                                                        DCSLuaCommands.sendMesgToGroup(
                                                            curUnit.groupId,
                                                            "G: Picked Up A Base Repair Internal Crate From " + curBaseName + "!",
                                                            5
                                                        );
                                                    })
                                                    .catch((err) => {
                                                        console.log("erroring line1363: ", err);
                                                    })
                                                ;
                                            }
                                            if (intCargoType === "loadCCBuild") {
                                                masterDBController.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: "|CCBuild|" + curBaseName + "|"})
                                                    .then(() => {
                                                        DCSLuaCommands.sendMesgToGroup(
                                                            curUnit.groupId,
                                                            "G: Picked Up A Base Command Center Build Crate From " + curBaseName + "!",
                                                            5
                                                        );
                                                    })
                                                    .catch((err) => {
                                                        console.log("erroring line1378: ", err);
                                                    })
                                                ;
                                            }
                                        } else {
                                            DCSLuaCommands.sendMesgToGroup(
                                                curUnit.groupId,
                                                "G: " + curBaseName + " logistical supply system is cut, repair the base!",
                                                5
                                            );
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("erroring line1363: ", err);
                                    })
                                ;
                            } else {
                                DCSLuaCommands.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: You are not within 2km of a friendly base to load internal crate!",
                                    5
                                );
                            }
                        })
                        .catch((err) => {
                            console.log("line 26: ", err);
                        })
                    ;
                })
                .catch((err) => {
                    console.log("line 26: ", err);
                });
        }
    }
}

export async function isCrateOnboard(unit: any, verbose: boolean) {
    if (unit.virtCrateType) {
        if (verbose) {
            DCSLuaCommands.sendMesgToGroup(
                unit.groupId,
                "G: " + _.split(unit.virtCrateType, "|")[2] + " is Onboard!",
                5
            )
                .catch((err) => {
                    console.log("line 324: ", err);
                });
        }
        return true;
    }
    if (verbose) {
        DCSLuaCommands.sendMesgToGroup(
            unit.groupId,
            "G: No Crates Onboard!",
            5
        )
            .catch((err) => {
                console.log("line 336: ", err);
            });
    }
    return false;
}

export async function isTroopOnboard(unit: any, verbose: boolean) {
    if (!_.isEmpty(unit.troopType)) {
        if (verbose) {
            DCSLuaCommands.sendMesgToGroup(
                unit.groupId,
                "G: " + unit.troopType + " is Onboard!",
                5
            )
                .catch((err) => {
                    console.log("line 351: ", err);
                });
        }
        return true;
    }
    if (verbose) {
        DCSLuaCommands.sendMesgToGroup(
            unit.groupId,
            "G: No Troops Onboard!",
            5
        )
            .catch((err) => {
                console.log("line 363: ", err);
            });
    }
    return false;
}

export async function loadTroops(unitId: string, troopType: string) {
    masterDBController.unitActionRead({unitId})
        .then((units) => {
            const curUnit = _.get(units, 0);
            if (curUnit.inAir) {
                DCSLuaCommands.sendMesgToGroup(
                    curUnit.groupId,
                    "G: Please Land Before Attempting Logistic Commands!",
                    5
                );
            } else {
                masterDBController.baseActionRead({baseType: "MOB", side: curUnit.coalition})
                    .then((bases) => {
                        const checkAllBase: any[] = [];
                        _.forEach(bases, (base) => {
                            checkAllBase.push(proximityController.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername)
                                .catch((err) => {
                                    console.log("line 59: ", err);
                                })
                            );
                        });

                        Promise.all(checkAllBase)
                            .then((playerProx) => {
                                if (_.some(playerProx)) {
                                    masterDBController.unitActionUpdateByUnitId({unitId, troopType})
                                        .then((unit: any) => {
                                            DCSLuaCommands.sendMesgToGroup(
                                                unit.groupId,
                                                "G: " + troopType + " Has Been Loaded!",
                                                5
                                            );
                                        })
                                        .catch((err) => {
                                            console.log("line 13: ", err);
                                        })
                                    ;
                                } else {
                                    // secondary check for second base distance
                                    masterDBController.baseActionRead({})
                                        .then((secondBases: any) => {
                                            const checkAllSecondBase: any[] = [];
                                            let curLogistic: any;
                                            masterDBController.unitActionRead({
                                                _id:  /Logistics/,
                                                dead: false,
                                                coalition: curUnit.coalition
                                            })
                                                .then((aliveBases) => {
                                                    _.forEach(secondBases, (base) => {
                                                        curLogistic = _.find(aliveBases, {name: base.name + " Logistics"});
                                                        if (!!curLogistic) {
                                                            checkAllSecondBase.push(proximityController.isPlayerInProximity(
                                                                curLogistic.lonLatLoc,
                                                                0.2,
                                                                curUnit.playername
                                                            )
                                                                .catch((err) => {
                                                                    console.log("line 427: ", err);
                                                                }));
                                                        }
                                                    });
                                                    Promise.all(checkAllSecondBase)
                                                        .then((secondPlayerProx: any[]) => {
                                                            if (_.some(secondPlayerProx)) {
                                                                masterDBController.unitActionUpdateByUnitId({unitId, troopType})
                                                                    .then(() => {
                                                                        DCSLuaCommands.sendMesgToGroup(
                                                                            curUnit.groupId,
                                                                            "G: " + troopType + " Has Been Loaded!",
                                                                            5
                                                                        );
                                                                    })
                                                                    .catch((err) => {
                                                                        console.log("line 13: ", err);
                                                                    })
                                                                ;
                                                            } else {
                                                                DCSLuaCommands.sendMesgToGroup(
                                                                    curUnit.groupId,
                                                                    "G: You are too far from a friendly base to load troops!",
                                                                    5
                                                                );
                                                            }
                                                        })
                                                        .catch((err) => {
                                                            console.log("line 448: ", err);
                                                        });
                                                })
                                                .catch((err) => {
                                                    console.log("line 452: ", err);
                                                });
                                        })
                                        .catch((err) => {
                                            console.log("line 456: ", err);
                                        });
                                }
                            })
                            .catch((err) => {
                                console.log("line 461: ", err);
                            });
                    })
                    .catch((err) => {
                        console.log("line 465: ", err);
                    });
            }
        })
        .catch((err) => {
            console.log("line 470: ", err);
        });
}

export async function menuCmdProcess(sessionName: string, pObj: any) {
    const defCrate = "iso_container_small";

    masterDBController.unitActionRead({unitId: pObj.unitId})
        .then((units) => {
            const curUnit = _.get(units, 0);
            if (curUnit) {
                masterDBController.srvPlayerActionsRead({name: curUnit.playername})
                    .then((player) => {
                        const curPlayer = _.get(player, [0]);
                        if (curPlayer) {
                            let spawnArray;
                            let curSpawnUnit;
                            // action menu
                            if (pObj.cmd === "serverTimeLeft") {
                                serverTimerController.timeLeft(curUnit);
                                sideLockController.setSideLockFlags();
                            }
                            if (pObj.cmd === "lookupAircraftCosts") {
                                userLivesController.lookupAircraftCosts(curPlayer.ucid);
                            }
                            if (pObj.cmd === "lookupLifeResource") {
                                userLivesController.lookupLifeResource(curPlayer.ucid);
                            }
                            if (pObj.cmd === "resourcePoints") {
                                resourcePointsController.checkResourcePoints(curPlayer);
                            }
                            if (pObj.cmd === "unloadExtractTroops") {
                                if (curUnit.inAir) {
                                    DCSLuaCommands.sendMesgToGroup(
                                        curUnit.groupId,
                                        "G: Please Land Before Attempting Logistic Commands!",
                                        5
                                    );
                                } else {
                                    if (exports.isTroopOnboard(curUnit)) {
                                        const checkAllBase: any[] = [];
                                        masterDBController.baseActionRead({baseType: "MOB", side: curUnit.coalition})
                                            .then((bases) => {
                                                _.forEach(bases, (base) => {
                                                    checkAllBase.push(proximityController.isPlayerInProximity(
                                                        base.centerLoc,
                                                        3.4,
                                                        curUnit.playername
                                                    )
                                                        .catch((err) => {
                                                            console.log("line 59: ", err);
                                                        }));
                                                });

                                                Promise.all(checkAllBase)
                                                    .then((playerProx) => {
                                                        // console.log('player prox: ', playerProx, _.some(playerProx)); _.some(playerProx)

                                                        if (_.some(playerProx)) {
                                                            masterDBController.unitActionUpdateByUnitId({
                                                                unitId: pObj.unitId,
                                                                troopType: null
                                                            })
                                                                .then(() => {
                                                                    DCSLuaCommands.sendMesgToGroup(
                                                                        curUnit.groupId,
                                                                        "G: " + curUnit.troopType + " has been dropped off at the base!",
                                                                        5
                                                                    );
                                                                })
                                                                .catch((err) => {
                                                                    console.log("line 26: ", err);
                                                                })
                                                            ;
                                                        } else {
                                                            const curTroops: any[] = [];
                                                            masterDBController.unitActionRead({
                                                                playerOwnerId: curPlayer.ucid,
                                                                isTroop: true,
                                                                dead: false
                                                            })
                                                                .then((delUnits) => {
                                                                    _.forEach(delUnits, (unit) => {
                                                                        masterDBController.unitActionUpdateByUnitId({
                                                                            unitId: unit.unitId,
                                                                            dead: true
                                                                        });
                                                                        groupController.destroyUnit(unit.name);
                                                                    });
                                                                    // spawn troop type
                                                                    curSpawnUnit = _.cloneDeep(groupController.getRndFromSpawnCat(
                                                                        curUnit.troopType,
                                                                        curUnit.coalition,
                                                                        false,
                                                                        true
                                                                    )[0]);
                                                                    spawnArray = {
                                                                        spwnName: "TU|" + curPlayer.ucid + "|" + curUnit.troopType + "|" +
                                                                            curUnit.playername + "|" + _.random(1000000, 9999999),
                                                                        type: curSpawnUnit.type,
                                                                        lonLatLoc: curUnit.lonLatLoc,
                                                                        heading: curUnit.hdg,
                                                                        country: curUnit.country,
                                                                        category: curSpawnUnit.category,
                                                                        playerCanDrive: true
                                                                    };

                                                                    for (
                                                                        let x = 0;
                                                                        x < curSpawnUnit.config[constants.config.timePeriod].spawnCount;
                                                                        x++
                                                                    ) {
                                                                        curTroops.push(spawnArray);
                                                                    }
                                                                    masterDBController.unitActionUpdateByUnitId({
                                                                        unitId: pObj.unitId,
                                                                        troopType: null
                                                                    })
                                                                        .catch((err) => {
                                                                            console.log("erroring line73: ", err);
                                                                        })
                                                                    ;
                                                                    groupController.spawnLogiGroup(curTroops, curUnit.coalition);
                                                                    DCSLuaCommands.sendMesgToGroup(
                                                                        curUnit.groupId,
                                                                        "G: " + curSpawnUnit.type + " has been deployed!",
                                                                        5
                                                                    );
                                                                })
                                                                .catch((err) => {
                                                                    console.log("line 26: ", err);
                                                                })
                                                            ;
                                                        }
                                                    })
                                                    .catch((err) => {
                                                        console.log("line 26: ", err);
                                                    })
                                                ;
                                            })
                                            .catch((err) => {
                                                console.log("line 26: ", err);
                                            })
                                        ;
                                    } else {
                                        // try to extract a troop
                                        proximityController.getTroopsInProximity(curUnit.lonLatLoc, 0.2, curUnit.coalition)
                                            .then((troopUnits: any) => {
                                                const curTroop = troopUnits[0];
                                                if (curTroop) {
                                                    // pickup troop
                                                    masterDBController.unitActionRead({
                                                        groupName: curTroop.groupName,
                                                        isCrate: false,
                                                        dead: false
                                                    })
                                                        .then((grpUnits) => {
                                                            _.forEach(grpUnits, (curTroopUnit) => {
                                                                groupController.destroyUnit(curTroopUnit.name);
                                                            });
                                                            masterDBController.unitActionUpdateByUnitId({
                                                                unitId: pObj.unitId,
                                                                troopType: curTroop.spawnCat
                                                            })
                                                                .catch((err) => {
                                                                    console.log("erroring line57: ", err);
                                                                });
                                                            DCSLuaCommands.sendMesgToGroup(
                                                                curUnit.groupId,
                                                                "G: Picked Up " + curTroop.type + "!",
                                                                5
                                                            );
                                                        })
                                                        .catch((err) => {
                                                            console.log("erroring line57: ", err);
                                                        })
                                                    ;
                                                } else {
                                                    // no troops
                                                    DCSLuaCommands.sendMesgToGroup(
                                                        curUnit.groupId,
                                                        "G: No Troops To Extract Or Unload!",
                                                        5
                                                    );
                                                }
                                            })
                                            .catch((err) => {
                                                console.log("line150: ", err);
                                            })
                                        ;
                                    }
                                }
                            }
                        }
                        if (pObj.cmd === "isTroopOnboard") {
                            exports.isTroopOnboard(curUnit, true);
                        }
                        if (pObj.cmd === "isCrateOnboard") {
                            exports.isCrateOnboard(curUnit, true);
                        }
                        if (pObj.cmd === "unpackCrate") {
                            proximityController.getLogiTowersProximity(curUnit.lonLatLoc, 0.8, curUnit.coalition)
                                .then((logiProx: any) => {
                                    if (logiProx.length) {
                                        DCSLuaCommands.sendMesgToGroup(
                                            curUnit.groupId,
                                            "G: You need to move farther away from Command Towers (800m)",
                                            5
                                        );
                                    } else {
                                        if (curUnit.inAir) {
                                            DCSLuaCommands.sendMesgToGroup(
                                                curUnit.groupId,
                                                "G: Please Land Before Attempting Logistic Commands!",
                                                5
                                            );
                                        } else {
                                            // real sling loading
                                            if (curUnit.inAir) {
                                                DCSLuaCommands.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    "G: Please Land Before Attempting Logistic Commands!",
                                                    5
                                                );
                                            } else {
                                                masterDBController.srvPlayerActionsRead({name: curUnit.playername})
                                                    .then((chkPlayer: any) => {
                                                        const curChkPlayer = chkPlayer[0];
                                                        if (curChkPlayer) {

                                                            masterDBController.staticCrateActionRead({})
                                                                .then((crateUpdate) => {
                                                                    const sendClient = {
                                                                        action : "CRATEUPDATE",
                                                                        crateNames: _.map(crateUpdate, "_id"),
                                                                        callback: "unpackCrate",
                                                                        unitId: pObj.unitId
                                                                    };
                                                                    const actionObj = {actionObj: sendClient, queName: "clientArray"};
                                                                    masterDBController.cmdQueActionsSave(actionObj)
                                                                        .catch((err) => {
                                                                            console.log("erroring line23: ", err);
                                                                        })
                                                                    ;
                                                                })
                                                                .catch((err) => {
                                                                    console.log("line 244: ", err);
                                                                })
                                                            ;
                                                        }
                                                    })
                                                    .catch((err) => {
                                                        console.log("line 244: ", err);
                                                    })
                                                ;
                                            }
                                        }
                                    }
                                })
                                .catch((err) => {
                                    console.log("line 125: ", err);
                                })
                            ;
                        }

                        // Troop Menu
                        if (pObj.cmd === "Soldier") {
                            exports.loadTroops(pObj.unitId, "Soldier");
                        }

                        if (pObj.cmd === "MG Soldier") {
                            exports.loadTroops(pObj.unitId, "MG Soldier");
                        }

                        if (pObj.cmd === "MANPAD") {
                            exports.loadTroops(pObj.unitId, "MANPAD");
                        }

                        if (pObj.cmd === "RPG") {
                            exports.loadTroops(pObj.unitId, "RPG");
                        }

                        if (pObj.cmd === "Mortar Team") {
                            exports.loadTroops(pObj.unitId, "Mortar Team");
                        }


                        if (pObj.cmd === "acquisitionCnt") {
                            masterDBController.unitActionRead({playerOwnerId: curPlayer.ucid, isCrate: false, isTroop: false, dead: false})
                                .then((unitsOwned) => {
                                    constants.getServer()
                                        .then((serverInfo: any) => {
                                            const grpGroups = _.transform(unitsOwned, (result: any, value: any) => {
                                                (result[value.groupName] || (result[value.groupName] = [])).push(value);
                                            }, {});

                                            DCSLuaCommands.sendMesgToGroup(
                                                curUnit.groupId,
                                                "G: You Have " + _.size(grpGroups) + "/" + serverInfo.maxUnitsMoving + " Unit Acquisitions In Play!",
                                                10
                                            );
                                        })
                                        .catch((err) => {
                                            console.log("erroring line427: ", err);
                                        })
                                    ;
                                })
                                .catch((err) => {
                                    console.log("erroring line427: ", err);
                                });
                        }

                        if (pObj.cmd === "EWR") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "JTAC") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "jtac", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "reloadGroup") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "reloadGroup", pObj.mobile, pObj.mass, "container_cargo");
                        }

                        if (pObj.cmd === "repairBase") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "repairBase", pObj.mobile, pObj.mass, "container_cargo");
                        }

                        if (pObj.cmd === "unarmedFuel") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "unarmedAmmo") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "armoredCar") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "APC") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "tank") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "artillary") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "mlrs") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "stationaryAntiAir") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "mobileAntiAir") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "samIR") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "mobileSAM") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, false, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "MRSAM") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, true, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        if (pObj.cmd === "LRSAM") {
                            exports.spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, true, "", pObj.mobile, pObj.mass, defCrate);
                        }

                        // Offense Menu
                        if (pObj.cmd === "spawnBomber") {
                            exports.spawnBomber(curUnit, curPlayer, pObj.type, pObj.rsCost);
                        }
                        if (pObj.cmd === "spawnAtkHeli") {
                            exports.spawnAtkHeli(curUnit, curPlayer, pObj.type, pObj.rsCost);
                        }

                        // Defense Menu
                        if (pObj.cmd === "spawnDefHeli") {
                            exports.spawnDefHeli(curUnit, curPlayer, pObj.type, pObj.rsCost);
                        }

                        // Support Menu
                        if (pObj.cmd === "spawnAWACS") {
                            exports.spawnAWACS(curUnit, curPlayer, pObj.type, pObj.rsCost);
                        }
                        if (pObj.cmd === "spawnTanker") {
                            exports.spawnTanker(curUnit, curPlayer, pObj.type, pObj.rsCost);
                        }

                        // Internal Crates
                        if (pObj.cmd === "InternalCargo") {
                            exports.internalCargo(curUnit, curPlayer, pObj.type);
                        }
                    })
                    .catch((err) => {
                        console.log("line537: ", err);
                    });
            }
        })
        .catch((err) => {
            console.log("line 543: ", err);
        });
}

export async function spawnAtkHeli(curUnit: any, curPlayer: any, heliType: string, rsCost: number) {
    console.log("HeliType: ", heliType, rsCost);

    let heliObj: any;
    if (heliType === "RussianAtkHeli") {
        heliObj = {
            name: "RussianAtkHeli",
            type: "Mi-28N",
            country: "RUSSIA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }
    if (heliType === "USAAtkHeli") {
        heliObj = {
            name: "USAAtkHeli",
            type: "AH-64D",
            country: "USA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }

    return resourcePointsController.spendResourcePoints(curPlayer, rsCost, "AtkHeli", heliObj)
        .then((spentPoints) => {
            if (spentPoints) {
                groupController.spawnAtkChopper(curUnit, heliObj);
            }
        })
        .catch((err) => {
            console.log("err line938: ", err);
        });
}

export async function spawnAWACS(curUnit: any, curPlayer: any, awacsType: string, rsCost: number) {
    console.log("AWACSType: ", awacsType, rsCost);

    let awacsObj: any;
    if (awacsType === "RussianAWACSA50") {
        awacsObj = {
            name: "RussianAWACSA50",
            type: "A-50",
            country: "RUSSIA",
            alt: "7620",
            speed: "265",
            radioFreq: 138000000,
            spawnDistance: 50,
            callsign: 50,
            onboard_num: 250,
            details: "(CALLSIGN: Overlord, Freq: 138Mhz AM)",
            hidden: false,
            eplrs: false
        };
    }
    if (awacsType === "RussianAWACSE2C") {
        awacsObj = {
            name: "RussianAWACSE2C",
            type: "E-2C",
            country: "AGGRESSORS",
            alt: "7620",
            speed: "265",
            radioFreq: 137000000,
            spawnDistance: 50,
            callsign: 50,
            onboard_num: 251,
            details: "(CALLSIGN: Chacha, Freq: 137Mhz AM)",
            hidden: false,
            eplrs: true
        };
    }
    if (awacsType === "USAAWACS") {
        awacsObj = {
            name: "USAAWACS",
            type: "E-3A",
            country: "USA",
            alt: "7620",
            speed: "265",
            radioFreq: 139000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Overlord11"
            },
            onboard_num: 249,
            details: "(CALLSIGN: Overlord, Freq: 139Mhz AM)",
            hidden: false,
            eplrs: true
        };
    }

    return resourcePointsController.spendResourcePoints(curPlayer, rsCost, "AWACS", awacsObj)
        .then((spentPoints) => {
            if (spentPoints) {
                groupController.spawnAWACSPlane(curUnit, awacsObj);
            }
        })
        .catch((err) => {
            console.log("err line938: ", err);
        });
}

export async function spawnBomber(curUnit: any, curPlayer: any, bomberType: string, rsCost: number) {
    console.log("BomberType: ", bomberType, rsCost);

    let bomberObj: any;
    if (bomberType === "RussianBomber") {
        bomberObj = {
            name: "RussianBomber",
            type: "Su-25M",
            country: "RUSSIA",
            alt: "2000",
            speed: "233",
            spawnDistance: 50,
            details: "(3 * Su-24M)",
            hidden: false
        };
    }
    if (bomberType === "USABomber") {
        bomberObj = {
            name: "USABomber",
            type: "B-1B",
            country: "USA",
            alt: "2000",
            speed: "233",
            spawnDistance: 50,
            details: "(1 * B-1B)",
            hidden: false
        };
    }

    return resourcePointsController.spendResourcePoints(curPlayer, rsCost, "Bomber", bomberObj)
        .then((spentPoints) => {
            if (spentPoints) {
                groupController.spawnBomberPlane(curUnit, bomberObj);
            }
        })
        .catch((err) => {
            console.log("err line938: ", err);
        });
}

export async function spawnCrateFromLogi(
    unit: any,
    type: string,
    crates: string,
    combo: string,
    special: string,
    mobile: boolean,
    mass: number,
    crateType: string
) {
    let spc: string;
    let crateObj;
    let crateCount = 0;
    if (special) {
        spc = special;
    } else {
        spc = "";
    }

    if (unit.inAir) {
        DCSLuaCommands.sendMesgToGroup(
            unit.groupId,
            "G: Please Land Before Attempting Logistic Commands!",
            5
        )
            .catch((err) => {
                console.log("line 1064: ", err);
            });
    } else {
        constants.getServer()
            .then((serverInfo: any) => {

                masterDBController.srvPlayerActionsRead({name: unit.playername})
                    .then((player: any) => {
                        const curPlayer = player[0];
                        if (menuUpdateController.virtualCrates) {
                            masterDBController.unitActionRead({playerOwnerId: curPlayer.ucid, isCrate: true, dead: false})
                                .then((delCrates) => {
                                    _.forEach(delCrates, (crate) => {
                                        // console.log('cr: ', crateCount, ' > ', serverInfo.maxCrates-1);
                                        if (crateCount > serverInfo.maxCrates - 2) {
                                            masterDBController.unitActionUpdateByUnitId({
                                                unitId: crate.unitId,
                                                dead: true
                                            })
                                                .catch((err) => {
                                                    console.log("erroring line387: ", err);
                                                })
                                            ;
                                            groupController.destroyUnit(crate.name);
                                        }
                                        crateCount++;
                                    });
                                    crateObj = {
                                        spwnName: "CU|" + curPlayer.ucid + "|" + type + "|" + spc + "|" +
                                            crates + "|" + combo + "|" + mobile + "|",
                                        type: "UAZ-469",
                                        lonLatLoc: unit.lonLatLoc,
                                        heading: unit.hdg,
                                        country: unit.country,
                                        isCrate: true,
                                        category: "GROUND",
                                        playerCanDrive: false
                                    };
                                    groupController.spawnLogiGroup([crateObj], unit.coalition);
                                })
                                .catch((err) => {
                                    console.log("line 358: ", err);
                                });
                        } else {
                            let closeLogi = "";
                            masterDBController.baseActionRead({})
                                .then((normalCrateBases: any) => {
                                    const checkAllBase: any = [];
                                    let curLogistic;
                                    masterDBController.unitActionRead({_id:  /Logistics/, dead: false, coalition: unit.coalition})
                                        .then((aliveBases) => {
                                            _.forEach(normalCrateBases, (base) => {
                                                curLogistic = _.find(aliveBases, {name: base.name + " Logistics"});
                                                closeLogi = _.get(base, "name");
                                                if (!!curLogistic) {
                                                    checkAllBase.push(proximityController.isPlayerInProximity(
                                                        curLogistic.lonLatLoc,
                                                        0.2,
                                                        unit.playername
                                                    )
                                                        .catch((err: any) => {
                                                            console.log("line 59: ", err);
                                                        }));
                                                }
                                            });
                                            Promise.all(checkAllBase)
                                                .then((playerProx) => {
                                                    // console.log('SC: ', _.some(playerProx), playerProx);
                                                    if (_.some(playerProx)) {
                                                        masterDBController.staticCrateActionRead({playerOwnerId: curPlayer.ucid})
                                                            .then((delCrates) => {
                                                                _.forEach(delCrates, (crate) => {
                                                                    if (crateCount > serverInfo.maxCrates - 2) {
                                                                        masterDBController.staticCrateActionDelete({
                                                                            _id: crate._id
                                                                        })
                                                                            .catch((err) => {
                                                                                console.log("erroring line573: ", err);
                                                                            })
                                                                        ;
                                                                        groupController.destroyUnit(crate._id);
                                                                    }
                                                                    crateCount++;
                                                                });
                                                                crateObj = {
                                                                    name: (spc) ? spc + "|#" + _.random(1000000, 9999999) : type +
                                                                        "|" + closeLogi + "|#" + _.random(1000000, 9999999),
                                                                    unitLonLatLoc: unit.lonLatLoc,
                                                                    shape_name: _.find(
                                                                        constants.staticDictionary, {_id: crateType}).shape_name ||
                                                                        "iso_container_small_cargo",
                                                                    category: "Cargo",
                                                                    type: crateType,
                                                                    heading: unit.hdg,
                                                                    canCargo: true,
                                                                    mass,
                                                                    playerOwnerId: curPlayer.ucid,
                                                                    templateName: type,
                                                                    special: spc,
                                                                    crateAmt: crates,
                                                                    isCombo: combo,
                                                                    playerCanDrive: mobile,
                                                                    country: constants.defCountrys[unit.coalition],
                                                                    side: unit.coalition,
                                                                    coalition: unit.coalition
                                                                };
                                                                crateController.spawnLogiCrate(crateObj, true);

                                                                DCSLuaCommands.sendMesgToGroup(
                                                                    unit.groupId,
                                                                    "G: " + _.toUpper(spc) + " " + type + " crate has been spawned!",
                                                                    5
                                                                );
                                                            })
                                                            .catch((err) => {
                                                                console.log("line 358: ", err);
                                                            })
                                                        ;
                                                    } else {
                                                        DCSLuaCommands.sendMesgToGroup(
                                                            unit.groupId,
                                                            "G: You are not close enough to the command center to spawn a crate!",
                                                            5
                                                        );
                                                    }
                                                })
                                                .catch((err) => {
                                                    console.log("line 26: ", err);
                                                })
                                            ;
                                        })
                                        .catch((err) => {
                                            console.log("line 13: ", err);
                                        })
                                    ;
                                })
                                .catch((err) => {
                                    console.log("line 26: ", err);
                                });
                        }
                    })
                    .catch((err) => {
                        console.log("line 13: ", err);
                    })
                ;
            })
            .catch((err) => {
                console.log("line 358: ", err);
            })
        ;
    }
}

export async function spawnDefHeli(curUnit: any, curPlayer: any, heliType: string, rsCost: number) {
    console.log("HeliType: ", heliType, rsCost);

    let heliObj: any;
    if (heliType === "RussianDefHeli") {
        heliObj = {
            name: "RussianDefHeli",
            type: "Mi-24V",
            country: "RUSSIA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }
    if (heliType === "USADefHeli") {
        heliObj = {
            name: "USADefHeli",
            type: "AH-1W",
            country: "USA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }

    resourcePointsController.spendResourcePoints(curPlayer, rsCost, "DefHeli", heliObj)
        .then((spentPoints) => {
            if (spentPoints) {
                groupController.spawnDefenseChopper(curUnit, heliObj);
            }
        })
        .catch((err) => {
            console.log("err line938: ", err);
        });
}

export async function spawnTanker(curUnit: any, curPlayer: any, tankerType: string, rsCost: number) {
    let tankerObj: any;
    const safeSpawnDistance: number = 100;
    let remoteLoc: number[];
    console.log("tankerType: ", tankerType, rsCost);

    if (tankerType === "BHABTKR") {
        tankerObj = {
            name: "BHABTKR",
            type: "KC-135",
            country: "USA",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: true,
                channel: 33,
                modeChannel: "Y",
                frequency: 1120000000
            },
            radioFreq: 125000000,
            spawnDistance: 50,
            callsign: {
                1: 2,
                2: 1,
                3: 1,
                name: "Arco11"
            },
            onboard_num: 135,
            details: "(TACAN: 33X, CALLSIGN: Arco, Freq: 125Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BHADTKR") {
        tankerObj = {
            name: "BHADTKR",
            type: "IL-78M",
            country: "UKRAINE",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: false
            },
            radioFreq: 126000000,
            spawnDistance: 50,
            callsign: 78,
            onboard_num: 78,
            details: "(CALLSIGN: 78, Freq: 126Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BLABTKR") {
        tankerObj = {
            name: "BLABTKR",
            type: "KC-135",
            country: "USA",
            alt: "4572",
            speed: "118.19444444444",
            tacan: {
                enabled: true,
                channel: 35,
                modeChannel: "Y",
                frequency: 1122000000
            },
            radioFreq: 127500000,
            spawnDistance: 50,
            callsign: {
                1: 3,
                2: 1,
                3: 1,
                name: "Shell11"
            },
            onboard_num: 135,
            details: "(TACAN: 35X, CALLSIGN: Shell, Freq: 127.5Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BLADTKR") {
        tankerObj = {
            name: "BLADTKR",
            type: "KC130",
            country: "USA",
            alt: "4572",
            speed: "169.58333333333",
            tacan: {
                enabled: true,
                channel: 36,
                modeChannel: "Y",
                frequency: 1123000000
            },
            radioFreq: 128000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Texaco11"
            },
            onboard_num: 130,
            details: "(TACAN: 36X, CALLSIGN: Texaco, Freq: 128Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RHADTKR") {
        tankerObj = {
            name: "RHADTKR",
            type: "IL-78M",
            country: "RUSSIA",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: false
            },
            radioFreq: 130000000,
            spawnDistance: 50,
            callsign: 78,
            onboard_num: 78,
            details: "(CALLSIGN: 78, Freq: 130Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RLABTKR") {
        tankerObj = {
            name: "RLABTKR",
            type: "KC-135",
            country: "AGGRESSORS",
            alt: "4572",
            speed: "118.19444444444",
            tacan: {
                enabled: true,
                channel: 43,
                modeChannel: "Y",
                frequency: 1130000000
            },
            radioFreq: 131000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Texaco11"
            },
            onboard_num: 135,
            details: "(TACAN: 43X, CALLSIGN: Texaco, Freq: 131Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RLADTKR") {
        tankerObj = {
            name: "RLADTKR",
            type: "KC130",
            country: "RUSSIA",
            alt: "4572",
            speed: "169.58333333333",
            tacan: {
                enabled: true,
                channel: 44,
                modeChannel: "Y",
                frequency: 1131000000
            },
            radioFreq: 132000000,
            spawnDistance: 50,
            callsign: 130,
            onboard_num: 130,
            details: "(TACAN: 44X, CALLSIGN: 130, Freq: 132Mhz AM)",
            hidden: false
        };
    }

    remoteLoc = zoneController.getLonLatFromDistanceDirection(curUnit.lonLatLoc, curUnit.hdg, tankerObj.spawnDistance);

    proximityController.getMOBsInProximity(remoteLoc, safeSpawnDistance, constants.enemyCountry[curUnit.coalition])
        .then((closeMOBs1: any) => {
            proximityController.getMOBsInProximity(
                curUnit.lonLatLoc,
                safeSpawnDistance,
                constants.enemyCountry[curUnit.coalition]
            )
                .then((closeMOBs2: any) => {
                    // console.log("closeMOBs: 1: ", closeMOBs1, " 2: ", closeMOBs2);
                    if (closeMOBs1.length > 0 || closeMOBs2.length > 0) {
                        DCSLuaCommands.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Please spawn Tanker farther away from enemy bases!",
                            5
                        );
                    } else {
                        resourcePointsController.spendResourcePoints(curPlayer, rsCost, "Tanker", tankerObj)
                            .then((spentPoints) => {
                                if (spentPoints) {
                                    groupController.spawnTankerPlane(curUnit, tankerObj, curUnit.lonLatLoc, remoteLoc);
                                }
                            })
                            .catch((err) => {
                                console.log("err line1400: ", err);
                            });
                    }
                })
                .catch((err) => {
                    console.log("err line1406: ", err);
                });
        })
        .catch((err) => {
            console.log("err line1411: ", err);
        });
}

export async function unpackCrate(playerUnit: any, country: string, type: string, special: string, combo: boolean, mobile: boolean) {
    return new Promise((resolve, reject) => {
        const curTimePeriod = constants.config.timePeriod || "modern";
        if (playerUnit.inAir) {
            DCSLuaCommands.sendMesgToGroup(
                playerUnit.groupId,
                "G: Please Land Before Attempting Logistic Commands!",
                5
            );
            resolve(false);
        } else {
            masterDBController.srvPlayerActionsRead({name: playerUnit.playername})
                .then((player: any) => {
                    const curPlayer = player[0];
                    masterDBController.unitActionReadStd({
                        playerOwnerId: curPlayer.ucid,
                        playerCanDrive: mobile,
                        isCrate: false,
                        dead: false
                    })
                        .then((delUnits) => {
                            constants.getServer()
                                .then((serverInfo: any) => {
                                    let curUnit = 0;
                                    const grpGroups = _.transform(delUnits, (result: any, value: any) => {
                                        (result[value.groupName] || (result[value.groupName] = [])).push(value);
                                    }, {});
                                    const tRem = _.size(grpGroups) - serverInfo.maxUnitsMoving;

                                    _.forEach(grpGroups, (gUnit) => {
                                        if (curUnit <= tRem) {
                                            _.forEach(gUnit, (unit: any) => {
                                                masterDBController.unitActionUpdateByUnitId({unitId: unit.unitId, dead: true})
                                                    .catch((err) => {
                                                        console.log("erroring line462: ", err);
                                                    })
                                                ;
                                                groupController.destroyUnit(unit.name);
                                            });
                                            curUnit++;
                                        }
                                    });
                                })
                                .catch((err) => {
                                    console.log("line 390: ", err);
                                })
                            ;
                        })
                        .catch((err) => {
                            console.log("line 390: ", err);
                        });

                    const newSpawnArray: any[] = [];
                    if (combo) {
                        constants.getUnitDictionary(curTimePeriod)
                            .then((unitDic: any) => {
                                const addHdg = 30;
                                let curUnitHdg = playerUnit.hdg;
                                const findUnits = _.filter(unitDic, (curUnitDict) => {
                                    return _.includes(curUnitDict.comboName, type);
                                });
                                _.forEach(findUnits, (cbUnit) => {
                                    const spawnUnitCount = cbUnit.config[curTimePeriod].spawnCount;
                                    for (let x = 0; x < spawnUnitCount; x++) {
                                        if (curUnitHdg > 359) {
                                            curUnitHdg = 30;
                                        }
                                        const unitStart = {
                                            ...cbUnit,
                                            spwnName: "DU|" + curPlayer.ucid + "|" + cbUnit.type + "|" + special + "|true|" + mobile + "|" +
                                                curPlayer.name + "|" + _.random(10000, 99999),
                                            lonLatLoc: playerUnit.lonLatLoc,
                                            heading: curUnitHdg,
                                            country,
                                            playerCanDrive: mobile
                                        };

                                        newSpawnArray.push(unitStart);
                                        curUnitHdg = curUnitHdg + addHdg;
                                    }
                                });
                                groupController.spawnLogiGroup(newSpawnArray, playerUnit.coalition);
                                resolve(true);
                            })
                            .catch((err) => {
                                reject(err);
                                console.log("line 743: ", err);
                            })
                        ;
                    } else {
                        constants.getUnitDictionary(curTimePeriod)
                            .then((unitDic: any) => {
                                const addHdg = 30;
                                let curUnitHdg = playerUnit.hdg;
                                let unitStart;
                                let pCountry = country;
                                const findUnit = _.find(unitDic, {_id: type});

                                const spawnUnitCount = findUnit.config[curTimePeriod].spawnCount;
                                if ((type === "1L13 EWR" || type === "55G6 EWR" || type === "Dog Ear radar") && _.get(playerUnit, "coalition") === 2) {
                                    console.log("EWR: UKRAINE");
                                    pCountry = "UKRAINE";
                                }

                                for (let x = 0; x < spawnUnitCount; x++) {
                                    unitStart = _.cloneDeep(findUnit);
                                    if (curUnitHdg > 359) {
                                        curUnitHdg = 30;
                                    }
                                    if (special === "jtac") {
                                        _.set(unitStart, "spwnName", "DU|" + curPlayer.ucid + "|" + type + "|" + special +
                                            "|true|" + mobile + "|" + curPlayer.name + "|");
                                    } else {
                                        _.set(unitStart, "spwnName", "DU|" + curPlayer.ucid + "|" + type + "|" + special +
                                            "|true|" + mobile + "|" + curPlayer.name + "|" + _.random(10000, 99999));
                                    }

                                    unitStart = {
                                        ...unitStart,
                                        lonLatLoc: playerUnit.lonLatLoc,
                                        heading: curUnitHdg,
                                        country: pCountry,
                                        playerCanDrive: mobile,
                                        special
                                    };

                                    newSpawnArray.push(unitStart);
                                    curUnitHdg = curUnitHdg + addHdg;
                                }
                                groupController.spawnLogiGroup(newSpawnArray, playerUnit.coalition);
                                resolve(true);
                            })
                            .catch((err) => {
                                reject(err);
                                console.log("line 777: ", err);
                            })
                        ;
                    }
                })
                .catch((err) => {
                    reject(err);
                    console.log("line 390: ", err);
                });
        }
    });
}
