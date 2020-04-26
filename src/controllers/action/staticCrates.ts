/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function destroyCrates(grpTypes: any, curCrateType: string, numCrate: number) {
    let cCnt = 1;
    _.forEach(_.get(grpTypes, [curCrateType]), (eCrate) => {
        if ( cCnt <= numCrate) {
            console.log("delCrate: ",  eCrate._id);
            ddcsController.staticCrateActionDelete({_id: eCrate._id})
                .catch((err: any) => {
                    console.log("erroring line23: ", err);
                })
            ;
            ddcsController.destroyUnit(eCrate.name);
            cCnt ++;
        }
    });
}

export async function processStaticCrate(crateObj: any) {
    const cPromise: any[] = [];
    _.forEach(crateObj.data, (crate, name) => {
        if (crate.alive) {
            // console.log('ACHK: ', name);
            cPromise.push(ddcsController.staticCrateActionUpdate({_id: name, lonLatLoc: [crate.lon, crate.lat]})
                .catch((err) => {
                    console.log("line 17: ", err);
                })
            );
        } else {
            // console.log('DCHK: ', name);
            cPromise.push(ddcsController.staticCrateActionDelete({_id: name})
                .catch((err: any) => {
                    console.log("line 23: ", err);
                })
            );
        }
    });
    Promise.all(cPromise)
        .then(() => {
            if (crateObj.callback === "unpackCrate") {
                exports.unpackStaticCrate(crateObj);
            }
        })
        .catch((err: any) => {
            console.log("erroring line35: ", err);
        });
}

export async function unpackStaticCrate(crateObj: any) {
    return ddcsController.unitActionRead({unitId: crateObj.unitId})
        .then((pUnit) => {
            const curPlayerUnit = pUnit[0];
            ddcsController.getStaticCratesInProximity(curPlayerUnit.lonLatLoc, 0.2, curPlayerUnit.coalition)
                .then((crates: any) => {
                    let grpTypes: any;
                    let localCrateNum;
                    let msg;
                    const curCrate = crates[0] || {};
                    const numCrate = curCrate.crateAmt;
                    const curCrateSpecial = curCrate.special || "";
                    const curCrateType = curCrate.templateName;
                    const isCombo = curCrate.isCombo;
                    const isMobile = curCrate.playerCanDrive;
                    // console.log('cratesInProx: ', serverName, curPlayerUnit.lonLatLoc, 0.2, curPlayerUnit.coalition, crates);
                    if (curCrate) {
                        grpTypes = _.transform(crates, (result: any, value: any) => {
                            (result[value.templateName] || (result[value.templateName] = [])).push(value);
                        }, {});

                        localCrateNum = _.get(grpTypes, [curCrateType], []).length;
                        // console.log('unpackingCrate: ', curCrate, localCrateNum, grpTypes);

                        if ( localCrateNum >=  numCrate) {
                            if (curCrateSpecial === "reloadGroup") {
                                // console.log('reloadGroup: ', serverName, curPlayerUnit, curCrate);
                                ddcsController.reloadSAM(curPlayerUnit)
                                    .then((response: any) => {
                                        // console.log('reload resp: ', response);
                                        if (response) {
                                            exports.destroyCrates(grpTypes, curCrateType, numCrate);
                                        }
                                    })
                                    .catch((err: any) => {
                                        console.log("line 32: ", err);
                                    })
                                ;
                            } else if (_.includes(curCrateSpecial, "CCBuild|")) {
                                console.log("trying to build cc on empty base");
                                ddcsController.spawnCCAtNeutralBase(curPlayerUnit)
                                    .then((response) => {
                                        console.log("spawn response1: ", response);
                                        if (response) {
                                            exports.destroyCrates(grpTypes, curCrateType, numCrate);
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("line 32: ", err);
                                    })
                                ;
                            } else {
                                msg = "G: Unpacking " + _.toUpper(curCrateSpecial) + " " + curCrateType + "!";
                                ddcsController.unpackCrate(
                                    curPlayerUnit,
                                    curCrate.country,
                                    curCrateType,
                                    curCrateSpecial,
                                    isCombo,
                                    isMobile
                                )
                                    .then((response: any) => {
                                        console.log("unpacking response2: ", response);
                                        if (response) {
                                            exports.destroyCrates(grpTypes, curCrateType, numCrate);
                                        }
                                    })
                                    .catch((err: any) => {
                                        console.log("line 32: ", err);
                                    })
                                ;
                                // console.log('singleCrateDestroy: ', curCrate.name);
                                // groupController.destroyUnit(serverName, curCrate.name);
                                ddcsController.sendMesgToGroup(
                                    curPlayerUnit.groupId,
                                    msg,
                                    5
                                );
                            }

                        } else {
                            if (localCrateNum) {
                                ddcsController.sendMesgToGroup(
                                    curPlayerUnit.groupId,
                                    "G: Not Enough Crates for " + curCrateType + "!(" + localCrateNum + "/" + numCrate + ")",
                                    5
                                );
                            } else {
                                ddcsController.sendMesgToGroup(
                                    curPlayerUnit.groupId,
                                    "G: No Crates In Area!",
                                    5
                                );
                            }
                        }
                    } else {
                        // no troops
                        ddcsController.sendMesgToGroup(
                            curPlayerUnit.groupId,
                            "G: No Crates To Unpack!",
                            5
                        );
                    }
                })
                .catch((err) => {
                    console.log("line 32: ", err);
                })
            ;
        })
        .catch((err) => {
            console.log("line 32: ", err);
        });
}
