/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

let randomMarkId: number;

export async function setFarpMarks() {
    ddcsController.baseActionRead({_id: {$not: /#/}})
        .then((bases) => {
            _.forEach(bases, (base) => {
                if (_.get(base, "baseMarkId")) {
                    ddcsController.cmdQueActionsSave({
                        actionObj: {
                            action: "CMD",
                            cmd: ["trigger.action.removeMark(" + _.get(base, "baseMarkId") + ")"],
                            reqID: 0
                        },
                        queName: "clientArray"
                    })
                        .then(() => {
                            randomMarkId = _.random(1000, 9999);
                            ddcsController.cmdQueActionsSave({
                                actionObj: {
                                    action: "CMD",
                                    cmd: [
                                        "trigger.action.markToAll(" + randomMarkId + ", [[" + _.get(base, "name") + "]], " +
                                        "coord.LLtoLO(" + _.get(base, ["centerLoc", 1]) + ", " + _.get(base, ["centerLoc", 0]) +
                                        ")" + ", true)"
                                    ],
                                    reqID: 0
                                },
                                queName: "clientArray"
                            })
                                .then(() => {
                                    ddcsController.baseActionUpdate({_id: _.get(base, "name")})
                                        .catch((err: any) => {
                                            console.log("erroring line32: ", err);
                                        })
                                    ;
                                })
                                .catch((err: any) => {
                                    console.log("erroring line13: ", err);
                                })
                            ;
                        })
                        .catch((err: any) => {
                            console.log("erroring line13: ", err);
                        })
                    ;
                } else {
                    randomMarkId = _.random(1000, 9999);
                    ddcsController.cmdQueActionsSave({
                        actionObj: {
                            action: "CMD",
                            cmd: [
                                "trigger.action.markToAll(" + randomMarkId + ", [[" + _.get(base, "name") + "]], " +
                                "coord.LLtoLO(" + _.get(base, ["centerLoc", 1]) + ", " + _.get(base, ["centerLoc", 0]) + ")" +
                                ", true)"
                            ],
                            reqID: 0
                        },
                        queName: "clientArray"
                    })
                        .then(() => {
                            ddcsController.baseActionUpdate({_id: _.get(base, "name")})
                                .catch((err: any) => {
                                    console.log("erroring line58: ", err);
                                })
                            ;
                        })
                        .catch((err) => {
                            console.log("erroring line13: ", err);
                        })
                    ;
                }
            });
        })
        .catch((err: any) => {
            console.log("line168", err);
        })
    ;
}

export async function setUnitMark(
    unit: any
) {
    if (!_.includes(_.get(ddcsController, "crateTypes"), _.get(unit, "type"))) {
        ddcsController.unitActionRead({_id: _.get(unit, "name")})
            .then((cUnit) => {
                const curUnit = cUnit[0];
                if (_.get(curUnit, "markId")) {
                    ddcsController.cmdQueActionsSave({
                        actionObj: {
                            action: "CMD",
                            cmd: [
                                "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                            ],
                            reqID: 0
                        },
                        queName: "clientArray"
                    })
                        .then(() => {
                            randomMarkId = _.random(1000, 9999);
                            ddcsController.cmdQueActionsSave({
                                actionObj: {
                                    action: "CMD",
                                    cmd: [
                                        "trigger.action.markToCoalition(" + randomMarkId + ", [[" + _.get(curUnit, "name") + "]], " +
                                        "coord.LLtoLO(" + _.get(curUnit, ["lonLatLoc", 1]) + ", " +
                                        _.get(curUnit, ["lonLatLoc", 0]) + "), " + " " + _.get(curUnit, "coalition") + "," +
                                        " true)"
                                    ],
                                    reqID: 0
                                },
                                queName: "clientArray"
                            })
                                .then(() => {
                                    ddcsController.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                                        .catch((err: any) => {
                                            console.log("erroring line99: ", err);
                                        })
                                    ;
                                })
                                .catch((err: any) => {
                                    console.log("erroring line13: ", err);
                                })
                            ;
                        })
                        .catch((err: any) => {
                            console.log("erroring line13: ", err);
                        })
                    ;
                } else {
                    randomMarkId = _.random(1000, 9999);
                    ddcsController.cmdQueActionsSave({
                        actionObj: {
                            action: "CMD",
                            cmd: [
                                "trigger.action.markToCoalition(" + randomMarkId + ", [[" + _.get(curUnit, "name") + "]], " +
                                "coord.LLtoLO(" + _.get(curUnit, ["lonLatLoc", 1]) + ", " +
                                _.get(curUnit, ["lonLatLoc", 0]) + ")," + " " + _.get(curUnit, "coalition") + ", true)"
                            ],
                            reqID: 0
                        },
                        queName: "clientArray"
                    })
                        .then(() => {
                            ddcsController.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                                .catch((err: any) => {
                                    console.log("erroring line126: ", err);
                                })
                            ;
                        })
                        .catch((err: any) => {
                            console.log("erroring line13: ", err);
                        })
                    ;
                }
                // console.log('CMD: ', curCMD);
            })
            .catch((err: any) => {
                console.log("erroring line138: ", err);
            })
        ;
    }
}
