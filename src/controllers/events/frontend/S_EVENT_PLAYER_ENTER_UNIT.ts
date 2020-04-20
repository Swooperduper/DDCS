/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
// import * as DCSLuaCommands from "../../player/DCSLuaCommands";
// import * as playersEvent from "../../events/backend/players";
// import * as userLivesController from "../../action/userLives";
// import * as menuUpdateController from "../../action/userLives";
// import * as unitsStaticsController from "../../serverToDbSync/unitsStatics";
import * as webPushCommands from "../../socketIO/webPush";

export async function processEventPlayerEnterUnit(sessionName: string, eventObj: any) {
    // Occurs when any player assumes direct control of a unit.
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
                                displaySide: curIUnit.coalition,
                                roleCode: "I",
                                msg: "C: " + curIUnit.playername + " enters a brand new " + curIUnit.type
                            };
                            if (iCurObj.iucid) {
                                webPushCommands.sendToCoalition({payload: {action: eventObj.action, data: _.cloneDeep(iCurObj)}});
                                masterDBController.simpleStatEventActionsSave(iCurObj);
                            }
                            // userLivesController.updateServerLives(serverName, curIUnit);
                            // console.log('PLAYER ENTER UNIT', curIUnit);
                            // menuUpdateController.logisticsMenu('resetMenu', serverName, curIUnit);
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
            console.log("err line1509: ", err);
        });
}
