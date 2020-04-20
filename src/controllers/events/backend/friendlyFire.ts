/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import * as masterDBController from "../../db";
import * as DCSLuaCommands from "../../player/DCSLuaCommands";
import * as playersEvent from "../../events/backend/players";
import * as userLivesController from "../../action/userLives";

export async function processFriendlyFire(sessionName: string, eventObj: any) {
    // var iCurObj;
    let iPlayer: any;
    let tPlayer: any;
    let curIUnit;
    let curTUnit;
    let mesg;
    // "friendly_fire", playerID, weaponName, victimPlayerID
    // console.log('cl: ', serverName, sessionName, eventObj);
    iPlayer = _.find(playersEvent.rtPlayerArray, {id: eventObj.data.arg1});
    tPlayer = _.find(playersEvent.rtPlayerArray, {id: eventObj.data.arg3});

    // slot



    /*
    iCurObj = {
        sessionName: sessionName,
        eventCode: constants.shortNames[eventObj.action],
        displaySide: 'A',
        roleCode: 'I',
        showInChart: true
    };


    if (iPlayer) {
        _.set(iCurObj, 'iucid', iPlayer.ucid);
        _.set(iCurObj, 'iName', iPlayer.name);
    }
    if (tPlayer) {
        _.set(iCurObj, 'tucid', tPlayer.ucid);
        _.set(iCurObj, 'tName', tPlayer.name);
    }
    */

    if (iPlayer && tPlayer) {
        if (iPlayer.slot !== tPlayer.slot && iPlayer.ucid !== tPlayer.ucid) {
            masterDBController.srvPlayerActionsRead({_id: iPlayer.ucid})
                .then((iPlayers: any) => {
                    const curIPlayer = iPlayers[0];
                    masterDBController.srvPlayerActionsRead({_id: tPlayer.ucid})
                        .then((tPlayers: any) => {
                            const curTPlayer = tPlayers[0];
                            // console.log('SAT: ', _.get(curIPlayer, 'safeLifeActionTime', 0) <
                            // new Date().getTime(), _.get(curIPlayer, 'safeLifeActionTime', 0), new Date().getTime());
                            if (curIPlayer.safeLifeActionTime || 0 < new Date().getTime()) {
                                masterDBController.unitActionRead({unitId: iPlayer.slot})
                                    .then((iunit: any) => {
                                        masterDBController.unitActionRead({unitId: tPlayer.slot})
                                            .then((tunit: any) => {
                                                curIUnit = iunit[0];
                                                curTUnit = tunit[0];
                                                // console.log('player: ', iPlayer, tPlayer);
                                                // removeLifePoints:
                                                // function (serverName, curPlayer, curUnit, execAction, isDirect, removeLP)
                                                if (constants.config.lifePointsEnabled) {
                                                    userLivesController.removeLifePoints(
                                                        curIPlayer,
                                                        curIUnit,
                                                        "Friendly Kill",
                                                        true,
                                                        6
                                                    );
                                                }

                                                if (curTUnit.inAir && constants.config.lifePointsEnabled) {
                                                    userLivesController.addLifePoints(
                                                        curTPlayer,
                                                        curTUnit
                                                    );
                                                }

                                                mesg = "A: " + constants.side[iPlayer.side] + " " + iPlayer.name + "(" + curIUnit.type +
                                                    ":-6 LP) has hit friendly " + tPlayer.name + "(" + curTUnit.type + ":+LPLoss) with a " +
                                                    eventObj.data.arg2 || "?";
                                                DCSLuaCommands.sendMesgToCoalition(
                                                    iPlayer.side,
                                                    mesg,
                                                    15
                                                );
                                            })
                                            .catch((err: any) => {
                                                console.log("err line45: ", err);
                                            });
                                    })
                                    .catch((err: any) => {
                                        console.log("err line45: ", err);
                                    });
                            }
                        })
                        .catch((err) => {
                            console.log("err line45: ", err);
                        });
                })
                .catch((err) => {
                    console.log("err line45: ", err);
                })
            ;
        }
    }
}
