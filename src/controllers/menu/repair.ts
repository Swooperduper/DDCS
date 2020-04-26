/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db";
import * as DCSLuaCommands from "../player/DCSLuaCommands";
import * as groupController from "../spawn/group";

export async function repairBase(base: any, curUnit: any) {
    const curBaseName = _.split(_.get(base, "name"), " #")[0];

    groupController.healBase(curBaseName, curUnit)
        .then((resp) => {
            if (resp) {
                masterDBController.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""})
                    .catch((err) => {
                        console.log("erroring line209: ", err);
                    })
                ;
                DCSLuaCommands.sendMesgToCoalition(
                    curUnit.coalition,
                    "C: " + curBaseName + " Base Has Been Repaired/Built!",
                    5
                );
            }
        })
        .catch((err) => {
            console.log("erroring line28: ", err);
        })
    ;
    return true;
}

export async function repairBaseSAMRadars() {
    return new Promise((resolve: any, reject: any) => {
        // grab all SAM's
        // group by SAM group
        const samTypeArray = _.map(_.filter( constants.unitDictionary, (filtObj) => {
            return filtObj.spawnCat === "samRadar" || filtObj.spawnCat === "unarmedAmmo";
        }) , "type");
        // console.log('sa: ', samTypeArray);
        masterDBController.unitActionRead({type: {$in: samTypeArray }, playerOwnerId: null, dead: false})
            .then((units: any) => {
                const groups = _.groupBy(units, "groupName");
                _.forEach(groups, (group: any) => {
                    let launcher = 0;
                    _.forEach(group, (element: any) => {
                        element.unitDict = _.find(
                            _.cloneDeep( constants.unitDictionary),
                            {_id: element.type}
                        );
                        if (element.unitDict.launcher) {
                            launcher += 1;
                        }
                    });
                    const curReqArray = _.get(
                        _.find(group, (curGroup) => {
                            return curGroup.unitDict.launcher;
                        }),
                        "unitDict.reloadReqArray"
                    );

                    const unitsMissing = _.difference(curReqArray, _.uniq(_.map(group, "type")));

                    // if there are units missing and the launcher exists, fix the group
                    if (unitsMissing.length && launcher && _.sample([true, false])) {
                        const curSAMTemplate = group[0];
                        const tNameArry = _.split(curSAMTemplate, "|");
                        // add missing units to existing array
                        if (tNameArry.length > 1) {
                            console.log("repairStarSam: ", tNameArry, _.get(tNameArry, [2]));
                            groupController.spawnStarSam(
                                curSAMTemplate.coalition,
                                tNameArry[1],
                                tNameArry[2].charAt(0),
                                launcher,
                                unitsMissing[0],
                                curSAMTemplate.lonLatLoc
                            );
                            console.log("TRUCKHERE? ", unitsMissing);
                            _.forEach(group, (removeElement) => {
                                groupController.destroyUnit(removeElement.name);
                            });
                        }
                        resolve(true);
                    }
                });
            })
            .catch((err) => {
                reject(err);
                console.log("line 96: ", err);
            })
        ;
    });
}
