/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

let randomMarkId: number;

export async function setFarpMarks() {
    const bases = await ddcsControllers.baseActionRead({enabled: true, _id: {$not: /#/}});
    for (const base of bases) {
        randomMarkId = _.random(1000, 9999);
        if (base.baseMarkId) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: ["trigger.action.removeMark(" + base.baseMarkId + ")"],
                    reqID: 0
                }
            });
        }
        await ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "CMD",
                cmd: [
                    "trigger.action.markToAll(" + randomMarkId + ", [[" + base.name + "]], " +
                    "coord.LLtoLO(" + base.centerLoc[1] + ", " + base.centerLoc[0] + ")" +
                    ", true)"
                ],
                reqID: 0
            }
        });
    }
}

export async function setUnitMark(
    unit: any
) {
    if (!_.includes(ddcsControllers.crateTypes, unit.type)) {
        const cUnit = await ddcsControllers.unitActionRead({_id: _.get(unit, "name")});
        const curUnit = cUnit[0];
        if (_.get(curUnit, "markId")) {
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            randomMarkId = _.random(1000, 9999);
            ddcsControllers.sendUDPPacket("frontEnd", {
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
            });
            await ddcsControllers.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                .catch((err) => {
                    console.log("82", err);
                });
        } else {
            randomMarkId = _.random(1000, 9999);
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.markToCoalition(" + randomMarkId + ", [[" + curUnit.name + "]], " +
                        "coord.LLtoLO(" + curUnit.lonLatLoc[1] + ", " +
                        curUnit.lonLatLoc[0] + ")," + " " + curUnit.coalition + ", true)"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            await ddcsControllers.unitActionUpdate({_id: curUnit._id, markId: randomMarkId})
                .catch((err) => {
                    console.log("103", err);
                });
        }
    }
}

export async function setCircleMark(
    unit: any
) {
    if (!_.includes(ddcsControllers.crateTypes, unit.type)) {
        const cUnit = await ddcsControllers.unitActionRead({_id: _.get(unit, "name")});
        const curUnit = cUnit[0];
        const baseInfo = await ddcsControllers.baseActionRead({_id : curUnit.name.replace(' Shelter','')})
        if (_.get(curUnit, "markId")) {
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            randomMarkId = _.random(1000, 9999);
            const circleRadius = 2000
            let circleOutlineColour = "{128,128,128,0.8}"
            let circleShadeColour = "{128,128,128,0.5}"
            if (curUnit.coalition === 1){
                circleOutlineColour = "{255,0,0,5}"
                circleShadeColour = "{255,0,0,0.2}"
            }   else if (curUnit.coalition === 2){
                circleOutlineColour = "{0,0,180,0.5}"
                circleShadeColour = "{0,0,120,0.2}"
            }
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                        "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                        _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                        circleOutlineColour + ", " +
                        circleShadeColour + ", " +
                        "1, " +
                        "true"+", [[" + _.get(curUnit, "name") + "]])"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            await ddcsControllers.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                .catch((err) => {
                    console.log("82", err);
                });
        } else {
            randomMarkId = _.random(1000, 9999);
            const circleRadius = 2000
            let circleOutlineColour = "{128,128,128,0.8}"
            let circleShadeColour = "{128,128,128,0.2}"
            if (curUnit.coalition === 1){
                circleOutlineColour = "{180,0,0,0.5}"
                circleShadeColour = "{120,0,0,0.2}"
            }   else if (curUnit.coalition === 2){
                circleOutlineColour = "{0,0,180,0.5}"
                circleShadeColour = "{0,0,120,0.2}"
            }
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                        "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                        _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                        circleOutlineColour + ", " +
                        circleShadeColour + ", " +
                        "1, " +
                        "true"+", [[" + _.get(curUnit, "name") + "]])"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            await ddcsControllers.unitActionUpdate({_id: curUnit._id, markId: randomMarkId})
                .catch((err) => {
                    console.log("103", err);
                });
        }
    }
}


export async function setNeutralCircleMark(
    unit: any
) {
    if (!_.includes(ddcsControllers.crateTypes, unit.type)) {
        const cUnit = await ddcsControllers.unitActionRead({_id: _.get(unit, "name")});
        const curUnit = cUnit[0];
        const baseInfo = await ddcsControllers.baseActionRead({_id : curUnit.name.replace(' Shelter','')})
        if (baseInfo[0].baseType === 'FOB'){
            if (_.get(curUnit, "markId")) {
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                randomMarkId = _.random(1000, 9999);
                const circleRadius = 2000
                let circleOutlineColour = "{128,128,128,0.8}"
                let circleShadeColour = "{128,128,128,0.5}"
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                            "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                            _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                            circleOutlineColour + ", " +
                            circleShadeColour + ", " +
                            "1, " +
                            "true"+", [[" + _.get(curUnit, "name") + "]])"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                await ddcsControllers.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                    .catch((err) => {
                        console.log("82", err);
                    });
            } else {
                randomMarkId = _.random(1000, 9999);
                const circleRadius = 2000
                let circleOutlineColour = "{128,128,128,0.8}"
                let circleShadeColour = "{128,128,128,0.2}"
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                            "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                            _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                            circleOutlineColour + ", " +
                            circleShadeColour + ", " +
                            "1, " +
                            "true"+", [[" + _.get(curUnit, "name") + "]])"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                await ddcsControllers.unitActionUpdate({_id: curUnit._id, markId: randomMarkId})
                    .catch((err) => {
                        console.log("103", err);
                    });
            }
        }
    }
}


export async function setCircleMarkers() {
    const shelters = await ddcsControllers.unitActionRead({type: "Shelter"});
    for (const shelter in shelters){
        const unit = shelters[shelter]
        if (!_.includes(ddcsControllers.crateTypes, unit.type)) {
            const cUnit = await ddcsControllers.unitActionRead({_id: _.get(unit, "name")});
            const curUnit = cUnit[0];
            if (_.get(curUnit, "markId")) {
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                randomMarkId = _.random(1000, 9999);
                const circleRadius = 2000
                let circleOutlineColour = "{128,128,128,0.8}"
                let circleShadeColour = "{128,128,128,0.5}"
                const baseInfo = await ddcsControllers.baseActionRead({_id : curUnit.name.replace(' Shelter','')})
                if ((curUnit.coalition === 1 && !curUnit.dead) || (curUnit.coalition === 1 && baseInfo[0].baseType === "MOB")){
                    circleOutlineColour = "{255,0,0,5}"
                    circleShadeColour = "{255,0,0,0.2}"
                }   else if ((curUnit.coalition === 2 && !curUnit.dead) || (curUnit.coalition === 2 && baseInfo[0].baseType === "MOB")){
                    circleOutlineColour = "{0,0,180,0.5}"
                    circleShadeColour = "{0,0,120,0.2}"
                } 
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                            "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                            _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                            circleOutlineColour + ", " +
                            circleShadeColour + ", " +
                            "1, " +
                            "true"+", [[" + _.get(curUnit, "name") + "]])"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                await ddcsControllers.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                    .catch((err) => {
                        console.log("82", err);
                    });
            } else {
                randomMarkId = _.random(1000, 9999);
                const circleRadius = 2000
                let circleOutlineColour = "{128,128,128,0.8}"
                let circleShadeColour = "{128,128,128,0.2}"
                const baseInfo = await ddcsControllers.baseActionRead({_id : curUnit.name.replace(' Shelter','')})
                if ((curUnit.coalition === 1 && !curUnit.dead) || (curUnit.coalition === 1 && baseInfo[0].baseType === "MOB")){
                    circleOutlineColour = "{255,0,0,5}"
                    circleShadeColour = "{255,0,0,0.2}"
                }   else if ((curUnit.coalition === 2 && !curUnit.dead) || (curUnit.coalition === 2 && baseInfo[0].baseType === "MOB")){
                    circleOutlineColour = "{0,0,180,0.5}"
                    circleShadeColour = "{0,0,120,0.2}"
                } 
                ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "CMD",
                        cmd: [
                            "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                            "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                            _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                            circleOutlineColour + ", " +
                            circleShadeColour + ", " +
                            "1, " +
                            "true"+", [[" + _.get(curUnit, "name") + "]])"
                        ],
                        reqID: 0
                    },
                    queName: "clientArray"
                });
                await ddcsControllers.unitActionUpdate({_id: curUnit._id, markId: randomMarkId})
                    .catch((err) => {
                        console.log("103", err);
                    });
            }
        }
       
    }
}

export async function setBaseCircleMark( baseName: any, baseSide: any) {
        const cUnit = await ddcsControllers.unitActionRead({_id: baseName + " Shelter"});
        const curUnit = cUnit[0];
        const baseInfo = await ddcsControllers.baseActionRead({_id : curUnit.name.replace(' Shelter','')})
        if (_.get(curUnit, "markId")) {
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.removeMark(" + _.get(curUnit, "markId") + ")"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            randomMarkId = _.random(1000, 9999);
            const circleRadius = 2000
            let circleOutlineColour = "{128,128,128,0.8}"
            let circleShadeColour = "{128,128,128,0.5}"
            if (baseSide === 1){
                circleOutlineColour = "{255,0,0,5}"
                circleShadeColour = "{255,0,0,0.2}"
            }   else if (baseSide === 2){
                circleOutlineColour = "{0,0,180,0.5}"
                circleShadeColour = "{0,0,120,0.2}"
            }
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                        "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                        _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                        circleOutlineColour + ", " +
                        circleShadeColour + ", " +
                        "1, " +
                        "true"+", [[" + _.get(curUnit, "name") + "]])"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            await ddcsControllers.unitActionUpdate({_id: _.get(curUnit, "_id"), markId: randomMarkId})
                .catch((err) => {
                    console.log("82", err);
                });
        } else {
            randomMarkId = _.random(1000, 9999);
            const circleRadius = 2000
            let circleOutlineColour = "{128,128,128,0.8}"
            let circleShadeColour = "{128,128,128,0.2}"
            if (baseSide === 1){
                circleOutlineColour = "{180,0,0,0.5}"
                circleShadeColour = "{120,0,0,0.2}"
            }   else if (baseSide === 2){
                circleOutlineColour = "{0,0,180,0.5}"
                circleShadeColour = "{0,0,120,0.2}"
            }
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: [
                        "trigger.action.circleToAll(-1," + randomMarkId + ", " +
                        "coord.LLtoLO(" + _.get(baseInfo[0], ["centerLoc", 1]) + ", " +
                        _.get(baseInfo[0], ["centerLoc", 0]) + "), " + circleRadius + ", " +
                        circleOutlineColour + ", " +
                        circleShadeColour + ", " +
                        "1, " +
                        "true"+", [[" + _.get(curUnit, "name") + "]])"
                    ],
                    reqID: 0
                },
                queName: "clientArray"
            });
            await ddcsControllers.unitActionUpdate({_id: curUnit._id, markId: randomMarkId})
                .catch((err) => {
                    console.log("103", err);
                });
        }
    
}