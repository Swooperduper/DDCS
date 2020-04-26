/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

const jtacDistance = 5;
let curLaserCode = 1688;
const redLaserCode = 1686;
const blueLaserCode = 1687;
const fiveMins = 5 * 60 * 1000;

export async function aliveJtac30SecCheck() {
    ddcsController.unitActionRead({
        proxChkGrp: "jtac",
        dead: false
    })
        .then((jtacUnits) => {
            _.forEach(jtacUnits, (jtUnit) => {
                if (jtUnit.jtacTarget) {
                    ddcsController.unitActionRead({
                        name: jtUnit.jtacTarget
                    })
                        .then((jtacTarget) => {
                            const curJtacTarget = _.get(jtacTarget, [0]);
                            if (curJtacTarget) {
                                if (!curJtacTarget.dead) {
                                    if (jtUnit.jtacReplenTime < new Date().getTime()) {
                                        exports.setLaserSmoke(jtUnit, curJtacTarget);
                                    }
                                } else {
                                    ddcsController.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null})
                                        .then(() => {
                                            exports.removeLaserIR(jtUnit);
                                            exports.jtacNewTarget(jtUnit);
                                        })
                                        .catch((err: any) => {
                                            console.log("erroring line101: ", err);
                                        })
                                    ;
                                }
                            } else {
                                ddcsController.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null})
                                    .then(() => {
                                        exports.removeLaserIR(jtUnit);
                                        exports.jtacNewTarget(jtUnit);
                                    })
                                    .catch((err) => {
                                        console.log("erroring line101: ", err);
                                    })
                                ;
                            }
                        })
                        .catch((err: any) => {
                            console.log("line 21: ", err);
                        })
                    ;
                } else {
                    exports.jtacNewTarget(jtUnit);
                }
            });
        })
        .catch((err: any) => {
            console.log("line 118: ", err);
        })
    ;
}

export async function jtacNewTarget(jtUnit: any) {
    const enemySide = (jtUnit.coalition === 1) ? 2 : 1;
    ddcsController.getCoalitionGroundUnitsInProximity(jtUnit.lonLatLoc, jtacDistance, enemySide)
        .then((enemyUnits: any) => {
            const enemyUnitNameArray = _.map(enemyUnits, "name");
            if (enemyUnitNameArray.length > 0) {
                ddcsController.cmdQueActionsSave({
                    actionObj: {
                        action: "ISLOSVISIBLE",
                        jtacUnitName: jtUnit.name,
                        enemyUnitNames: enemyUnitNameArray
                    },
                    queName: "clientArray"
                })
                    .catch((err: any) => {
                        console.log("erroring line525: ", err);
                    })
                ;
            }
        })
        .catch((err: any) => {
            console.log("line 118: ", err);
        })
    ;
}

export async function processLOSEnemy(losReply: any) {
    if (losReply.data.length) {
        let enemyUnit;
        const unitPThrArray: any[] = [];
        ddcsController.unitActionRead({name: losReply.jtacUnitName})
            .then((fJtacUnit) => {
                const curJtacUnit = _.get(fJtacUnit, [0]);
                ddcsController.unitActionRead({name: {$in: losReply.data}})
                    .then((eJtacUnit) => {
                        _.forEach(eJtacUnit, (jtUnit) => {
                            const curUnitDict = _.find(_.get(ddcsController, "unitDictionary"), {_id: jtUnit.type});
                            if (curUnitDict) {
                                _.set(jtUnit, "threatLvl", curUnitDict.threatLvl);
                                unitPThrArray.push(jtUnit);
                            } else {
                                console.log("cant findUnit: ", curUnitDict, jtUnit.type);
                            }
                        });
                        enemyUnit = _.first(_.orderBy(unitPThrArray, "threatLvl", "desc"));
                        exports.setLaserSmoke(curJtacUnit, enemyUnit);
                    })
                    .catch((err: any) => {
                        console.log("line 117: ", err);
                    })
                ;
            })
            .catch((err: any) => {
                console.log("line 122: ", err);
            })
        ;
    }
}

export async function removeLaserIR(jtUnit: any) {
    console.log("Removing Laser: ", jtUnit.name);
    ddcsController.cmdQueActionsSave({
        actionObj: {
            action : "REMOVELASERIR",
            jtacUnitName: jtUnit.name
        },
        queName: "clientArray"
    })
        .catch((err: any) => {
            console.log("erroring line23: ", err);
        })
    ;
}

export async function setLaserSmoke(jtUnit: any, enemyUnit: any) {
    console.log("Setting Laser: ", jtUnit.name);
    if (jtUnit.coalition === 1) {
        curLaserCode = redLaserCode;
    } else {
        curLaserCode = blueLaserCode;
    }

    ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "SETLASERSMOKE",
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition
        },
        queName: "clientArray"
    })
        .catch((err: any) => {
            console.log("erroring line23: ", err);
        })
    ;
    ddcsController.unitActionUpdate({_id: jtUnit.name, jtacTarget: enemyUnit.name, jtacReplenTime: new Date().getTime() + fiveMins})
        .catch((err: any) => {
            console.log("erroring line28: ", err);
        })
    ;
}
