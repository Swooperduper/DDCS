/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as masterDBController from "../db";
import * as groupController from "../spawn/group";
import * as proximityController from "../proxZone/proximity";

export async function reloadSAM(unitCalling: any) {
    return new Promise((resolve, reject) => {
        proximityController.getGroundUnitsInProximity(unitCalling.lonLatLoc, 0.2, false)
            .then((units: any) => {
                const closestUnit = _.filter(units, {coalition: unitCalling.coalition})[0];
                if (closestUnit) {
                    masterDBController.unitActionRead({groupName: closestUnit.groupName, isCrate: false, dead: false})
                        .then((samUnits) => {
                            // console.log('samu: ', samUnits, closestUnit.groupName);
                            if (samUnits.length) {
                                const curSamType = samUnits[0].type;
                                const curUnitDict = _.find(constants.unitDictionary, {_id: curSamType});
                                const curReloadArray = curUnitDict.reloadReqArray;
                                // console.log('uD: ', curUnitDict);
                                if (curReloadArray.length === _.intersection(curReloadArray, _.map(samUnits, "type")).length) {
                                    groupController.spawnGroup(samUnits);
                                    resolve(true);
                                } else {
                                    DCSLuaCommands.sendMesgToGroup(
                                        unitCalling.groupId,
                                        "G: " + curSamType + " Is Too Damaged To Be Reloaded!",
                                        5
                                    );
                                    resolve(false);
                                }
                            } else {
                                DCSLuaCommands.sendMesgToGroup(
                                    unitCalling.groupId,
                                    "G: Group does not have all of the pieces to reload",
                                    5
                                );
                                resolve(false);
                            }
                        })
                        .catch((err) => {
                            reject(err);
                            console.log("line 26: ", err);
                        })
                    ;
                } else {
                    DCSLuaCommands.sendMesgToGroup(
                        unitCalling.groupId,
                        "G: There are no units close enough to reload",
                        5
                    );
                    resolve(false);
                }
            })
            .catch((err) => {
                reject(err);
                console.log("line 125: ", err);
            })
        ;
    });
}
