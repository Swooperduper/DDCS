/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";

export async function reloadSAM(unitCalling: typing.IUnit): Promise<boolean> {
    const engineCache = ddcsControllers.getEngineCache();
    const units = await ddcsControllers.getGroundUnitsInProximity(unitCalling.lonLatLoc, 0.2, false);
    const closestUnit = _.filter(units, {coalition: unitCalling.coalition})[0];
    if (closestUnit) {
        const samUnits = await ddcsControllers.unitActionRead({groupName: closestUnit.groupName, isCrate: false, dead: false});
        if (samUnits.length) {
            const curSamType = samUnits[0].type;
            const curUnitDict = _.find(engineCache.unitDictionary, {_id: curSamType});
            if (curUnitDict) {
                const curReloadArray = curUnitDict.reloadReqArray;
                if (curReloadArray.length === _.intersection(curReloadArray, _.map(samUnits, "type")).length) {
                    await ddcsControllers.spawnGroup(samUnits);
                    return true;
                } else {
                    await ddcsControllers.sendMesgToGroup(
                        unitCalling.groupId,
                        "G: " + curSamType + " Is Too Damaged To Be Reloaded!",
                        5
                    );
                    return false;
                }
            }
        } else {
            await ddcsControllers.sendMesgToGroup(
                unitCalling.groupId,
                "G: Group does not have all of the pieces to reload",
                5
            );
            return false;
        }
    } else {
        await ddcsControllers.sendMesgToGroup(
            unitCalling.groupId,
            "G: There are no units close enough to reload",
            5
        );
        return false;
    }
    return false;
}
