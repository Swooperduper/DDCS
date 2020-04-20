/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as userLivesController from "../../action/userLives";
import * as webPushCommands from "../../socketIO/webPush";
import * as weaponComplianceController from "../../action/weaponCompliance";
import * as proximityController from "../../proxZone/proximity";

export async function processEventTakeoff(sessionName: string, eventObj: any) {
    let place: string;
    // Occurs when an aircraft takes off from an airbase, farp, or ship.
    if (eventObj.data.arg6) {
        place = " from " + eventObj.data.arg6;
    } else if (eventObj.data.arg5) {
        place = " from " + eventObj.data.arg5;
    } else {
        place = "";
    }

    masterDBController.unitActionRead({unitId: eventObj.data.arg3})
        .then((iunit: any) => {
            masterDBController.srvPlayerActionsRead({sessionName})
                .then((playerArray: any) => {
                    const curIUnit = iunit[0];
                    const curUnitSide = curIUnit.coalition;
                    if (_.isUndefined(curIUnit)) {
                        console.log("isUndef: ", eventObj);
                    }
                    if (curIUnit) {
                        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                        console.log("takeoff: ", curIUnit.playername);
                        if (iPlayer.ucid) {
                            if (weaponComplianceController.checkWeaponComplianceOnTakeoff(iPlayer, curIUnit)) {
                                proximityController.getBasesInProximity(curIUnit.lonLatLoc, 5, curUnitSide)
                                    .then((friendlyBases: any) => {
                                        // console.log('T6', friendlyBases);
                                        if (friendlyBases.length > 0) {
                                            const iCurObj = {
                                                sessionName,
                                                eventCode: constants.shortNames[eventObj.action],
                                                iucid: iPlayer.ucid,
                                                iName: curIUnit.playername,
                                                displaySide: curIUnit.coalition,
                                                roleCode: "I",
                                                msg: "C: " + curIUnit.type + "(" + curIUnit.playername + ") has taken off" + place
                                            };
                                            /*
                                            console.log('T7', serverName,
                                                iPlayer,
                                                curIUnit,
                                                'Takeoff');
                                             */
                                            if (constants.config.lifePointsEnabled) {
                                                userLivesController.removeLifePoints(
                                                    iPlayer,
                                                    curIUnit,
                                                    "Takeoff"
                                                );
                                            }
                                            webPushCommands.sendToCoalition({payload: {
                                                action: eventObj.action,
                                                data: _.cloneDeep(iCurObj)
                                            }});
                                            masterDBController.simpleStatEventActionsSave(iCurObj);
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("err line45: ", err);
                                    })
                                ;
                            }
                        }
                    }
                })
                .catch((err) => {
                    console.log("err line45: ", err);
                });
        })
        .catch((err) => {
            console.log("err line49: ", err);
        });
}
