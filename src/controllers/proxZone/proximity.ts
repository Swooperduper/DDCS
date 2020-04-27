/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db";
import * as groupController from "../spawn/group";
import * as menuUpdateController from "../menu/menuUpdate";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as baseSpawnFlagsController from "../action/baseSpawnFlags";
import * as unitsStaticsController from "../serverToDbSync/unitsStatics";
import * as resetCampaignController from "../action/resetCampaign";

const unitsInProxLogiTowers = {};
const unitsInProxBases = {};

export async function checkUnitsToBaseForCapture() {
    let sideArray = {};
    const promiseBaseSideCount: any[] = [];
    const campaignState = {
        red: 0,
        blue: 0
    };
    masterDBController.baseActionRead({baseType: "MOB"})
        .then((bases) => {
            _.forEach(bases, (base) => {
                _.set(campaignState,
                    [_.get(constants, ["side", base.side])],
                    _.get(campaignState, [_.get(constants, ["side", base.side])]) + 1);
                promiseBaseSideCount.push(exports.getGroundUnitsInProximity(base.centerLoc, 3, true)
                    .then((unitsInRange: any[]) => {
                        sideArray = _.transform(unitsInRange, (result: any[], value) => {
                            (result[value.coalition] || (result[value.coalition] = [])).push(value);
                        });
                        if (base.side === 1 && _.get(sideArray, [2], []).length > 0) {
                            // console.log('enemy in range: ', base.name + ': enemy Blue');
                            if (_.get(sideArray, [1], []).length === 0) {
                                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 2);
                                DCSLuaCommands.sendMesgToAll(
                                    base.name + " HAS BEEN CAPTURED BY BLUE",
                                    60
                                );
                                // console.log('Spawning Support Units', base, 2);
                                groupController.spawnSupportBaseGrp(base.name, 2);
                                masterDBController.baseActionUpdateSide({name: base.name, side: 2})
                                    .then(() => {
                                        baseSpawnFlagsController.setbaseSides();
                                    })
                                    .catch((err) => {
                                        console.log("erroring line162: ", err);
                                    })
                                ;
                                masterDBController.unitActionRead({name: base.name + " Logistics", dead: false})
                                    .then((aliveLogistics) => {
                                        if (aliveLogistics.length > 0) {
                                            groupController.spawnLogisticCmdCenter({}, false, base, 2);
                                        }
                                    })
                                    .catch((err: any) => {
                                        console.log("erroring line189: ", err);
                                    })
                                ;
                                masterDBController.unitActionRead({name: base.name + " Communications", dead: false})
                                    .then((aliveComms) => {
                                        if (aliveComms.length > 0) {
                                            groupController.spawnRadioTower({}, false, base, 2);
                                        }
                                    })
                                    .catch((err: any) => {
                                        console.log("erroring line189: ", err);
                                    })
                                ;
                            }
                        }
                        if (base.side === 2 && _.get(sideArray, [1], []).length > 0) {
                            // console.log('enemy in range: ', base.name + ': enemy Red');
                            if (_.get(sideArray, [2], []).length === 0) {
                                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 1);
                                DCSLuaCommands.sendMesgToAll(
                                    base.name + " HAS BEEN CAPTURED BY RED",
                                    60
                                );
                                // console.log('Spawning Support Units', base, 1);
                                groupController.spawnSupportBaseGrp(base.name, 1);
                                masterDBController.baseActionUpdateSide({name: base.name, side: 1})
                                    .then(() => {
                                        baseSpawnFlagsController.setbaseSides();
                                    })
                                    .catch((err: any) => {
                                        console.log("erroring line189: ", err);
                                    })
                                ;
                                masterDBController.unitActionRead({name: base.name + " Logistics", dead: false})
                                    .then((aliveLogistics) => {
                                        if (aliveLogistics.length > 0) {
                                            groupController.spawnLogisticCmdCenter({}, false, base, 1);
                                        }
                                    })
                                    .catch((err: any) => {
                                        console.log("erroring line189: ", err);
                                    })
                                ;
                            }
                        }
                        if (base.side === 0 && (_.get(sideArray, [1], []).length > 0 || _.get(sideArray, [2], []).length > 0)) {
                            let unitSide = 0;
                            if (_.get(sideArray, [1], []).length > 0) {
                                unitSide = 1;
                            }
                            if (_.get(sideArray, [2], []).length > 0) {
                                unitSide = 2;
                            }
                            console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", unitSide);
                            DCSLuaCommands.sendMesgToAll(
                                base.name + " HAS BEEN CAPTURED",
                                60
                            );
                            // console.log('Spawning Support Units', base, unitSide);
                            groupController.spawnSupportBaseGrp(base.name, unitSide);
                            masterDBController.baseActionUpdateSide({name: base.name, side: unitSide})
                                .then(() => {
                                    baseSpawnFlagsController.setbaseSides();
                                })
                                .catch((err: any) => {
                                    console.log("erroring line189: ", err);
                                })
                            ;
                            masterDBController.unitActionRead({name: base.name + " Logistics", dead: false})
                                .then((aliveLogistics) => {
                                    if (aliveLogistics.length > 0) {
                                        groupController.spawnLogisticCmdCenter({}, false, base, unitSide);
                                    }
                                })
                                .catch((err: any) => {
                                    console.log("erroring line189: ", err);
                                })
                            ;
                            masterDBController.unitActionRead({name: base.name + " Communications", dead: false})
                                .then((aliveComms) => {
                                    if (aliveComms.length > 0) {
                                        groupController.spawnRadioTower({}, false, base, unitSide);
                                    }
                                })
                                .catch((err) => {
                                    console.log("erroring line189: ", err);
                                })
                            ;
                        }
                    })
                    .catch((err: any) => {
                        console.log("line 64: ", err);
                    }))
                ;
            });
            Promise.all(promiseBaseSideCount)
                .then(() => {
                    if (!_.isEmpty(bases)) {
                        if (campaignState.red === 0 && !unitsStaticsController.lockUpdates) {
                            console.log("BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON ");
                            masterDBController.serverActionsUpdate({resetFullCampaign: true})
                                .then(() => {
                                    unitsStaticsController.setLockUpdates(true);
                                    resetCampaignController.setTimeToRestart(new Date().getTime() + _.get(constants, "time.fiveMins"));
                                    DCSLuaCommands.sendMesgToAll(
                                        "Blue has won the campaign, Map will reset in 5 minutes.",
                                        _.get(constants, "time.fiveMins")
                                    );
                                })
                                .catch((err) => {
                                    console.log("line 178: ", err);
                                })
                            ;
                        }
                        if (campaignState.blue === 0 && !unitsStaticsController.lockUpdates) {
                            console.log("RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON ");
                            masterDBController.serverActionsUpdate({resetFullCampaign: true})
                                .then(() => {
                                    unitsStaticsController.setLockUpdates(true);
                                    resetCampaignController.setTimeToRestart(new Date().getTime() + _.get(constants, "time.fiveMins"));
                                    DCSLuaCommands.sendMesgToAll(
                                        "Red has won the campaign, Map will reset in 5 minutes.",
                                        _.get(constants, "time.fiveMins")
                                    );
                                })
                                .catch((err: any) => {
                                    console.log("line 197: ", err);
                                })
                            ;
                        }
                    }
                })
                .catch((err) => {
                    console.log("line 64: ", err);
                })
            ;
        })
        .catch((err: any) => {
            console.log("line 118: ", err);
        })
    ;
}

/*
export async function checkUnitsToBaseForTroops() {
    // check every base that is owned by red or blue, 20 km sphere
    masterDBController.baseActionRead({baseType: "MOB"})
        .then((bases) => {
            _.forEach(bases, (base) => {
                const curBaseName = base.name;
                _.set(unitsInProxBases, [curBaseName], _.get(unitsInProxBases, [curBaseName], {}));
                exports.getPlayersInProximity(_.get(base, "centerLoc"), 3.4, false, base.side)
                    .then((unitsInProx: any[]) => {
                        _.forEach(_.get(unitsInProxBases, [curBaseName], {}), (unit, key) => {
                            if (!_.find(unitsInProx, {unitId: _.toNumber(key)}) && unit.enabled) {
                                _.set(unit, "enabled", false);
                                // console.log('resetMenuProxUnits: ', curBaseName, cId);
                                // remove logi f10 menu
                                menuUpdateController.logisticsMenu("resetMenu", unit.data);
                            }
                        });
                        _.forEach(unitsInProx, (unit) => {
                            const cId = unit.unitId;
                            if (cId && curBaseName) {
                                if (!_.get(unitsInProxBases, [curBaseName, cId, "enabled"])) {
                                    _.set(unitsInProxBases, [curBaseName, cId], {
                                        enabled: true,
                                        data: unit
                                    });
                                    // console.log('A baseTroops: ', curBaseName, cId);
                                    // update f10 radio menu
                                    // console.log('addTroopsMenu: ', curBaseName, cId);
                                    menuUpdateController.logisticsMenu("addTroopsMenu", unit);
                                }
                            }
                        });
                    })
                    .catch((err: any) => {
                        console.log("line 64: ", err);
                    })
                ;
            });
        })
        .catch((err: any) => {
            console.log("line 35: ", err);
        })
    ;
}

export async function checkUnitsToLogisticTowers() {
    masterDBController.unitActionRead({proxChkGrp: "logisticTowers", dead: false})
        .then((logiUnits) => {
            _.forEach(logiUnits, (logiUnit) => {
                const curLogiName = logiUnit.name;
                _.set(unitsInProxLogiTowers, [curLogiName], _.get(unitsInProxLogiTowers, [curLogiName], {}));
                exports.getPlayersInProximity(_.get(logiUnit, "lonLatLoc"), 0.2, false, logiUnit.coalition)
                    .then((unitsInProx: any[]) => {
                        _.forEach(_.get(unitsInProxLogiTowers, [curLogiName], {}), (unit, key) => {
                            if (!_.find(unitsInProx, {unitId: _.toNumber(key)}) && unit.enabled) {
                                _.set(unit, "enabled", false);
                                // console.log('R logiTower: ', curLogiName, cId);
                                // remove logi f10 menu
                                menuUpdateController.logisticsMenu("resetMenu", unit.data );
                            }
                        });
                        _.forEach(unitsInProx, (unit) => {
                            const cId = unit.unitId;
                            if (cId && curLogiName) {
                                if (!_.get(unitsInProxLogiTowers, [curLogiName, cId, "enabled"])) {
                                    _.set(unitsInProxLogiTowers, [curLogiName, cId], {
                                        enabled: true,
                                        data: unit
                                    });
                                    // console.log('A logiTower: ', curLogiName, cId);
                                    // update f10 radio menu
                                    menuUpdateController.logisticsMenu("addLogiCratesMenu", unit);
                                }
                            }
                        });
                    })
                    .catch((err: any) => {
                        console.log("line 64: ", err);
                    })
                ;
            });
        })
        .catch((err: any) => {
            console.log("line 64: ", err);
        })
    ;
}
*/

export function extractUnitsBackToBase(unit: any) {
    let friendlyBase: string = "";
    _.forEach(unitsInProxBases, (base, baseName) => {
        if (_.get(base, [unit.unitId, "enabled"])) {
            friendlyBase = baseName;
        }
    });
    return friendlyBase;
}

export async function getCoalitionGroundUnitsInProximity(lonLat: number[], kmDistance: number, side: number) {
    return await masterDBController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: "GROUND",
            coalition: side
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        });
}

export async function getMOBsInProximity(lonLat: number[], kmDistance: number, side: number) {
    return masterDBController.baseActionRead({
            centerLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            side,
            enabled: true,
            baseType: "MOB"
        })
        .then((closestBase) => {
            // console.log('close units ' + closeUnits);
            return closestBase;
        })
        .catch((err: any) => {
            console.log("line 27: ", err);
        });
}

export async function getBasesInProximity(lonLat: number[], kmDistance: number, side: number) {
    return masterDBController.baseActionRead({
            centerLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            side,
            enabled: true
        })
        .then((closestBase) => {
            // console.log('close units ' + closeUnits);
            return closestBase;
        })
        .catch((err) => {
            console.log("line 27: ", err);
        });
}

export async function getGroundUnitsInProximity(lonLat: number[], kmDistance: number, isTroop: boolean) {
    const troopQuery = {
        dead: false,
        lonLatLoc: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: (lonLat) ? lonLat : [0, 0]
                },
                $maxDistance: kmDistance * 1000
            }
        },
        category: "GROUND",
        isCrate: false
    };
    if (!isTroop) {
        _.set(troopQuery, "isTroop", false);
    }
    return masterDBController.unitActionReadStd(troopQuery)
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        })
        .catch((err: any) => {
            console.log("line 413: ", err);
        });
}

export async function getLogiTowersProximity(lonLat: number[], kmDistance: number, coalition: number) {
    return masterDBController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: "STRUCTURE",
            proxChkGrp: "logisticTowers",
            coalition
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        })
        .catch((err: any) => {
            console.log("line 27: ", err);
        })
        ;
}

export async function getPlayersInProximity(lonLat: number[], kmDistance: number, inAir: boolean, coalition: number) {
    return masterDBController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            playername: {
                $ne: ""
            },
            category: {
                $in: ["AIRPLANE", "HELICOPTER"]
            },
            inAir,
            coalition
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        });
}

export async function getStaticCratesInProximity(lonLat: number[], kmDistance: number, coalition: number) {
    return masterDBController.staticCrateActionReadStd({
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            coalition
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        })
        .catch((err: any) => {
            console.log("line 140: ", err);
        });
}

export async function getTroopsInProximity(lonLat: number[], kmDistance: number, coalition: number) {
    return masterDBController.unitActionReadStd({
            dead: false,
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            playername: {
                $eq: ""
            },
            type: {
                $in: [
                    "Soldier M249",
                    "Infantry AK",
                    "Stinger manpad",
                    "Soldier M4",
                    "Paratrooper RPG-16",
                    "2B11 mortar",
                    "SA-18 Igla manpad"
                ]
            },
            coalition
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        })
        .catch((err: any) => {
            console.log("line 176: ", err);
        });
}

export async function getVirtualCratesInProximity(lonLat: number[], kmDistance: number, coalition: number) {
    return masterDBController.unitActionReadStd({
            dead: false,
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            name : {
                $regex: /CU\|/
            },
            inAir: false,
            coalition
        })
        .then((closeUnits) => {
            // console.log('close units ' + closeUnits);
            return closeUnits;
        })
        .catch((err: any) => {
            console.log("line 140: ", err);
        });
}

export async function isPlayerInProximity(lonLat: number[], kmDistance: number, playerName: string) {
    return masterDBController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            playername: playerName
        })
        .then((closeUnits) => {
            return closeUnits.length > 0;
        })
        .catch((err: any) => {
            console.log("line 149: ", err);
        });
}

export function unitInProxLogiTowers(unit: any) {
    let friendlyLogi: string = "";
    _.forEach(unitsInProxLogiTowers, (logiTower, logiName) => {
        if (_.get(logiTower, [unit.unitId, "enabled"])) {
            friendlyLogi = logiName;
        }
    });
    return friendlyLogi;
}
