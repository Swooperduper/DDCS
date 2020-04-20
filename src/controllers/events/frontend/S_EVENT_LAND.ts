/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as groupController from "../../spawn/group";
import * as webPushCommands from "../../socketIO/webPush";
import * as userLivesController from "../../action/userLives";
import * as proximityController from "../../proxZone/proximity";

export async function processEventLand(sessionName: string, eventObj: any) {
    let place: string = "";
    let baseLand: string;

    // Occurs when an aircraft lands at an airbase, farp or ship
    if (eventObj.data.arg6) {
        baseLand = eventObj.data.arg6;
    } else if (eventObj.data.arg5) {
        baseLand = eventObj.data.arg5;
    }

    masterDBController.unitActionRead({unitId: eventObj.data.arg3, isCrate: false})
        .then((iunit: any) => {
            masterDBController.srvPlayerActionsRead({sessionName})
                .then((playerArray: any) => {
                    const curIUnit = iunit[0];

                    if (_.isUndefined(curIUnit)) {
                        console.log("isUndef: ", eventObj);
                    }
                    if (curIUnit) {
                        const curUnitName = curIUnit.name;
                        if (_.includes(curUnitName, "LOGISTICS|")) {
                            const bName = _.split(curUnitName, "|")[2];
                            const curSide = curIUnit.coalition;
                            masterDBController.baseActionRead({_id: bName})
                                .then((bases: any) => {
                                    const curBase = bases[0]; // does this work?
                                    console.log("LANDINGCARGO: ", curBase.side === curSide, baseLand === bName, baseLand, " = ", bName,
                                        curIUnit.category);
                                    if (curBase.side === curSide) {
                                        groupController.replenishUnits( bName, curSide);
                                        groupController.healBase( bName, curIUnit);
                                    }
                                })
                                .catch((err) => {
                                console.log("err line1323: ", err);
                                })
                            ;
                        }
                        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                        console.log("landing: ", curIUnit.playername);
                        if (iPlayer) {
                            const curUnitSide = curIUnit.coalition;
                            proximityController.getBasesInProximity(curIUnit.lonLatLoc, 5, curUnitSide)
                                .then((friendlyBases: any) => {
                                    if (friendlyBases.length > 0) {
                                        const curBase = _.get(friendlyBases, [0], {});
                                        place = " at " + curBase._id;
                                        masterDBController.srvPlayerActionsApplyTempToRealScore({
                                            _id: iPlayer._id,
                                            groupId: curIUnit.groupId
                                        })
                                            .catch((err) => {
                                                console.log("line70", err);
                                            });
                                        const iCurObj = {
                                            sessionName,
                                            eventCode: constants.shortNames[eventObj.action],
                                            iucid: iPlayer.ucid,
                                            iName: curIUnit.playername,
                                            displaySide: curIUnit.coalition,
                                            roleCode: "I",
                                            msg: "C: " + curIUnit.type + "(" + curIUnit.playername + ") has landed at friendly " + place
                                        };
                                        console.log("FriendBaseLand: ", iCurObj.msg);
                                        if (iCurObj.iucid && constants.config.lifePointsEnabled) {
                                            userLivesController.addLifePoints(
                                                iPlayer,
                                                curIUnit,
                                                "Land"
                                            );
                                            webPushCommands.sendToCoalition({payload: {
                                                action: eventObj.action,
                                                data: _.cloneDeep(iCurObj)
                                            }});
                                            masterDBController.simpleStatEventActionsSave(iCurObj);
                                        }
                                    }
                                })
                                .catch((err) => {
                                    console.log("err line100: ", err);
                                });
                        }
                    }
                })
                .catch((err) => {
                    console.log("err line108: ", err);
                });
        })
        .catch((err) => {
            console.log("err line113: ", err);
        });
}
