/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as webPushCommands from "../../socketIO/webPush";

export async function processEventBirth(sessionName: string, eventObj: any) {
    // Occurs when any object is spawned into the mission.
    const curUnitId = eventObj.data.arg3;
    if (curUnitId) {
        masterDBController.unitActionRead({unitId: eventObj.data.arg3})
            .then((iunit: any) => {
                const curIUnit = iunit[0];
                if (curIUnit.playername !== "") {
                    masterDBController.srvPlayerActionsRead({sessionName})
                        .then((playerArray: any) => {
                            if (curIUnit) {
                                const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                                if (iPlayer) {
                                    const iCurObj = {
                                        sessionName,
                                        eventCode: constants.shortNames[eventObj.action],
                                        iucid: iPlayer.ucid,
                                        iName: curIUnit.playername,
                                        displaySide: curIUnit.coalition,
                                        roleCode: "I",
                                        msg: "C: " + curIUnit.playername + " enters a brand new " + curIUnit.type,
                                        groupId: curIUnit.groupId
                                    };
                                    if (iCurObj.iucid) {
                                        webPushCommands.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                                        masterDBController.simpleStatEventActionsSave(iCurObj);
                                    }
                                    masterDBController.srvPlayerActionsClearTempScore({_id: iCurObj.iucid, groupId: iCurObj.groupId})
                                        .catch((err) => {
                                            console.log("line35", err);
                                        })
                                    ;
                                    /*
                                    DCSLuaCommands.sendMesgToCoalition(
                                        _.get(iCurObj, 'displaySide'),
                                        serverName,
                                        _.get(iCurObj, 'msg'),
                                        5
                                    );
                                    */
                                }
                            }
                        })
                        .catch((err) => {
                            console.log("err line45: ", err);
                        })
                    ;
                }
            })
            .catch((err) => {
                console.log("err line45: ", err);
            })
        ;
    }
}
