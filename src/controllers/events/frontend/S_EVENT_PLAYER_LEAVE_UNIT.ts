/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
// import * as playersEvent from "../../events/backend/players";
import * as unitsStaticsController from "../../serverToDbSync/unitsStatics";
import * as webPushCommands from "../../socketIO/webPush";

export async function processEventPlayerLeaveUnit(sessionName: string, eventObj: any) {
    // Occurs when any player relieves control of a unit to the AI.
    masterDBController.unitActionRead({unitId: eventObj.data.arg3})
        .then((iunit: any) => {
            masterDBController.srvPlayerActionsRead({sessionName})
                .then((playerArray: any) => {
                    const curIUnit = iunit[0];
                    if (curIUnit) {

                        unitsStaticsController.processUnitUpdates(sessionName, {action: "D", data: {name: curIUnit.name}});

                        const iPlayer = _.find(playerArray, {name: curIUnit.playername});
                        if (iPlayer) {
                            const iCurObj = {
                                sessionName,
                                eventCode: constants.shortNames[eventObj.action],
                                iucid: iPlayer.ucid,
                                iName: curIUnit.playername,
                                displaySide: curIUnit.coalition,
                                roleCode: "I",
                                msg: "C: " + curIUnit.playername + " leaves his " + curIUnit.type
                            };
                            if (iCurObj.iucid) {
                                webPushCommands.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                                masterDBController.simpleStatEventActionsSave(iCurObj);
                            }
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
                });
        })
        .catch((err) => {
            console.log("err line40: ", err);
        });
}
