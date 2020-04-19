/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
import * as proximityController from "../proxZone/proximity";
import * as groupController from "../spawn/group";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as baseSpawnFlagsController from "../action/baseSpawnFlags";

let mainNeutralBases;

export async function checkCmdCenters() {
    let basesChanged = false;
    let curSide;
    return masterDBController.baseActionRead({baseType: "FOB", enabled: true})
        .then((bases) => {
            _.forEach(bases, (base) => {
                return masterDBController.unitActionRead({_id: base.name + " Logistics", dead: false})
                    .then((isCCExist) => {
                        if (isCCExist.length > 0) {
                            curSide = _.get(isCCExist[0], "coalition");
                            if (_.get(base, "side") !== curSide) {
                                basesChanged = true;
                                masterDBController.baseActionUpdateSide({name: base.name, side: curSide})
                                    .catch((err: any) => {
                                        console.log("erroring line162: ", err);
                                    })
                                ;
                            }
                        } else {
                            if (_.get(base, "side") !== 0) {
                                basesChanged = true;
                                masterDBController.baseActionUpdateSide({name: base.name, side: 0})
                                    .catch((err: any) => {
                                        console.log("erroring line162: ", err);
                                    })
                                ;
                            }
                        }
                    })
                    .catch((err: any) => {
                        console.log("erroring line162: ", err);
                    })
                ;
            });
            if (basesChanged) {
                baseSpawnFlagsController.setbaseSides();
            }
        })
        .catch((err: any) => {
            console.log("line 1303: ", err);
        })
    ;
}

export async function spawnCCAtNeutralBase(curPlayerUnit: any) {
    // console.log('spwnNeutral: ', curPlayerUnit);
    return new Promise((resolve, reject) => {
        masterDBController.baseActionRead({baseType: "FOB", enabled: true})
            .then((bases) => {
                mainNeutralBases = _.remove(bases, (base) => {
                    return !_.includes(base.name, "#");
                });
                // console.log('MNB: ', mainNeutralBases);
                _.forEach(mainNeutralBases, (base) => {
                    proximityController.getPlayersInProximity(_.get(base, "centerLoc"), 3.4, false, curPlayerUnit.coalition)
                        .then((unitsInProx: any) => {
                            if (_.find(unitsInProx, {playername: curPlayerUnit.playername})) {
                                masterDBController.unitActionRead({_id: base.name + " Logistics", dead: false})
                                    .then((cmdCenters) => {
                                        if (cmdCenters.length > 0) {
                                            console.log("player own CC??: " + cmdCenters[0].coalition === curPlayerUnit.coalition);
                                            if (cmdCenters[0].coalition === curPlayerUnit.coalition) {
                                                console.log("cmdCenter already exists, replace units: " + base.name + " " + cmdCenters);
                                                DCSLuaCommands.sendMesgToGroup(
                                                    curPlayerUnit.groupId,
                                                    "G: " + base.name + " Command Center Already Exists, Support Units Replaced.",
                                                    5
                                                );
                                                // console.log('SSB: ', serverName, base.name, curPlayerUnit.coalition);
                                                groupController.spawnSupportBaseGrp( base.name, curPlayerUnit.coalition );
                                            } else {
                                                console.log(" enemy cmdCenter already exists: " + base.name + " " + cmdCenters);
                                                DCSLuaCommands.sendMesgToGroup(
                                                    curPlayerUnit.groupId,
                                                    "G: Enemy " + base.name + " Command Center Already Exists.",
                                                    5
                                                );
                                            }
                                            resolve(false);
                                        } else {
                                            console.log("cmdCenter doesnt exist " + base.name);
                                            groupController.spawnLogisticCmdCenter({}, false, base, curPlayerUnit.coalition);
                                            masterDBController.baseActionUpdateSide({name: base.name, side: curPlayerUnit.coalition})
                                                .then(() => {
                                                    baseSpawnFlagsController.setbaseSides();
                                                    groupController.spawnSupportBaseGrp( base.name, curPlayerUnit.coalition );
                                                    resolve(true);
                                                })
                                                .catch((err) => {
                                                    console.log("erroring line162: ", err);
                                                })
                                            ;
                                            DCSLuaCommands.sendMesgToCoalition(
                                                curPlayerUnit.coalition,
                                                "C: " + base.name + " Command Center Is Now Built!",
                                                20
                                            );
                                        }
                                    })
                                    .catch((err) => {
                                        reject(err);
                                        console.log("erroring line162: ", err);
                                    })
                                ;
                            }
                        })
                        .catch((err) => {
                            reject(err);
                            console.log("line 1297: ", err);
                        })
                    ;
                });
            })
            .catch((err) => {
                reject(err);
                console.log("line 1303: ", err);
            })
        ;
    });
}
