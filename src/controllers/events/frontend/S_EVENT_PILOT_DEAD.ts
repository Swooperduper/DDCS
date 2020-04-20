/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
import * as DCSLuaCommands from "../../player/DCSLuaCommands";
// import * as playersEvent from "../../events/backend";
import * as webPushCommands from "../../socketIO/webPush";

export async function processEventPilotDead(sessionName: string, eventObj: any) {
    const nowTime = new Date().getTime();
    // Occurs when the pilot of an aircraft is killed.
    // Can occur either if the player is alive and crashes or
    // if a weapon kills the pilot without completely destroying the plane.
    masterDBController.unitActionRead({unitId: eventObj.data.arg3})
        .then((iunit: any) => {
            masterDBController.srvPlayerActionsRead({sessionName})
                .then((playerArray: any) => {
                    const curIUnit = iunit[0];
                    if (curIUnit) {
                        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                        if (iPlayer) {
                            const iCurObj = {
                                sessionName,
                                eventCode: constants.shortNames[eventObj.action],
                                iucid: iPlayer.ucid,
                                iName: curIUnit.playername,
                                displaySide: "A",
                                roleCode: "I",
                                msg: "A: " + constants.side[curIUnit.coalition] + " " + curIUnit.type + "(" + curIUnit.playername +
                                    ") pilot is dead",
                                groupId: curIUnit.groupId
                            };
                            if (iCurObj.iucid) {
                                webPushCommands.sendToAll({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                                masterDBController.simpleStatEventActionsSave(iCurObj);
                            }
                            masterDBController.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId})
                                .catch((err) => {
                                    console.log("line35", err);
                                });

                            if (constants.config.inGameHitMessages) {
                                DCSLuaCommands.sendMesgToAll(
                                    iCurObj.msg,
                                    5,
                                    nowTime + constants.time.oneMin
                                );
                            }
                        }
                    }
                })
                .catch((err) => {
                    console.log("err line45: ", err);
                });
        })
        .catch((err) => {
            console.log("err line41: ", err);
        });
}
