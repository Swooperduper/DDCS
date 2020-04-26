/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

let mainNeutralBases;

export async function checkCmdCenters() {
    let basesChanged = false;
    let curSide;
    return ddcsController.baseActionRead({baseType: "FOB", enabled: true})
        .then((bases) => {
            _.forEach(bases, (base) => {
                return ddcsController.unitActionRead({_id: base.name + " Logistics", dead: false})
                    .then((isCCExist) => {
                        if (isCCExist.length > 0) {
                            curSide = _.get(isCCExist[0], "coalition");
                            if (_.get(base, "side") !== curSide) {
                                basesChanged = true;
                                ddcsController.baseActionUpdateSide({name: base.name, side: curSide})
                                    .catch((err: any) => {
                                        console.log("erroring line162: ", err);
                                    })
                                ;
                            }
                        } else {
                            if (_.get(base, "side") !== 0) {
                                basesChanged = true;
                                ddcsController.baseActionUpdateSide({name: base.name, side: 0})
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
                ddcsController.setbaseSides();
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
        ddcsController.baseActionRead({baseType: "FOB", enabled: true})
            .then((bases) => {
                mainNeutralBases = _.remove(bases, (base) => {
                    return !_.includes(base.name, "#");
                });
                // console.log('MNB: ', mainNeutralBases);
                _.forEach(mainNeutralBases, (base) => {
                    ddcsController.getPlayersInProximity(_.get(base, "centerLoc"), 3.4, false, curPlayerUnit.coalition)
                        .then((unitsInProx: any) => {
                            if (_.find(unitsInProx, {playername: curPlayerUnit.playername})) {
                                ddcsController.unitActionRead({_id: base.name + " Logistics", dead: false})
                                    .then((cmdCenters) => {
                                        if (cmdCenters.length > 0) {
                                            console.log("player own CC??: " + cmdCenters[0].coalition === curPlayerUnit.coalition);
                                            if (cmdCenters[0].coalition === curPlayerUnit.coalition) {
                                                console.log("cmdCenter already exists, replace units: " + base.name + " " + cmdCenters);
                                                ddcsController.sendMesgToGroup(
                                                    curPlayerUnit.groupId,
                                                    "G: " + base.name + " Command Center Already Exists, Support Units Replaced.",
                                                    5
                                                );
                                                // console.log('SSB: ', serverName, base.name, curPlayerUnit.coalition);
                                                ddcsController.spawnSupportBaseGrp( base.name, curPlayerUnit.coalition );
                                            } else {
                                                console.log(" enemy cmdCenter already exists: " + base.name + " " + cmdCenters);
                                                ddcsController.sendMesgToGroup(
                                                    curPlayerUnit.groupId,
                                                    "G: Enemy " + base.name + " Command Center Already Exists.",
                                                    5
                                                );
                                            }
                                            resolve(false);
                                        } else {
                                            console.log("cmdCenter doesnt exist " + base.name);
                                            ddcsController.spawnLogisticCmdCenter({}, false, base, curPlayerUnit.coalition);
                                            ddcsController.baseActionUpdateSide({name: base.name, side: curPlayerUnit.coalition})
                                                .then(() => {
                                                    ddcsController.setbaseSides();
                                                    ddcsController.spawnSupportBaseGrp( base.name, curPlayerUnit.coalition );
                                                    resolve(true);
                                                })
                                                .catch((err) => {
                                                    console.log("erroring line162: ", err);
                                                })
                                            ;
                                            ddcsController.sendMesgToCoalition(
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
