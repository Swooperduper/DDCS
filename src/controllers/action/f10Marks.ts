/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

let randomMarkId: number;

export async function setFarpMarks() {
    const bases = await ddcsControllers.baseActionRead({_id: {$not: /#/}});
    for (const base of bases) {
        randomMarkId = _.random(1000, 9999);
        if (base.baseMarkId) {
            ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "CMD",
                    cmd: ["trigger.action.removeMark(" + base.baseMarkId + ")"],
                    reqID: 0
                },
                queName: "clientArray"
            });
        }
        ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "CMD",
                cmd: [
                    "trigger.action.markToAll(" + randomMarkId + ", [[" + base.name + "]], " +
                    "coord.LLtoLO(" + base.centerLoc[1] + ", " + base.centerLoc[0] + ")" +
                    ", true)"
                ],
                reqID: 0
            },
            queName: "clientArray"
        });
        await ddcsControllers.baseActionUpdate({_id: base.name})
            .catch((err) => {
                console.log("44", err);
            });
    }
}

export async function setUnitMark(
    unit: any
) {
    /*
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

     */
}
