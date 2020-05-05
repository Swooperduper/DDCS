/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function repairBase(base: ddcsController.IBase, curUnit: ddcsController.IUnit): Promise<void> {
    const curBaseName = _.split(_.get(base, "name"), " #")[0];

    const resp = await ddcsController.healBase(curBaseName, curUnit);
    if (resp) {
        await ddcsController.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""});
        await ddcsController.sendMesgToCoalition(
            curUnit.coalition,
            "C: " + curBaseName + " Base Has Been Repaired/Built!",
            5
        );
    }
}

export async function repairBaseSAMRadars(): Promise<void> {
    const samTypeArray = _.map(_.filter( ddcsController.unitDictionary, (filtObj) => {
        return filtObj.spawnCat === "samRadar" || filtObj.spawnCat === "unarmedAmmo";
    }) , "type");

    const units = await ddcsController.unitActionRead({type: {$in: samTypeArray }, playerOwnerId: null, dead: false});
    const groups = _.groupBy(units, "groupName");
    for (const group of Object.keys(groups)) {
        let launcher = 0;
        for (const element of groups[group]) {
            const curUnitDict = _.find(
                _.cloneDeep( ddcsController.unitDictionary),
                {_id: element.type}
            );
            if (curUnitDict) {
                element.unitDict = curUnitDict;
                if (element.unitDict.launcher) {
                    launcher += 1;
                }
            }
        }
        const curReqArray = _.get(
            _.find(groups[group], (curGroup) => {
                return curGroup.unitDict.launcher;
            }),
            "unitDict.reloadReqArray"
        );

        const unitsMissing = _.difference(curReqArray, _.uniq(_.map(groups[group], "type")));

        // if there are units missing and the launcher exists, fix the group
        if (unitsMissing.length && launcher && _.sample([true, false])) {
            const curSAMTemplate = groups[group][0];
            const tNameArry = _.split(curSAMTemplate._id, "|");
            // add missing units to existing array
            if (tNameArry.length > 1) {
                console.log("repairStarSam: ", tNameArry, _.get(tNameArry, [2]));
                ddcsController.spawnStarSam(
                    curSAMTemplate.coalition,
                    tNameArry[1],
                    tNameArry[2].charAt(0),
                    launcher,
                    unitsMissing[0],
                    curSAMTemplate.lonLatLoc
                );
                console.log("TRUCKHERE? ", unitsMissing);
                for (const removeElement of groups[group]) {
                    await ddcsController.destroyUnit(removeElement.name);
                }
            }
        }
    }
}
