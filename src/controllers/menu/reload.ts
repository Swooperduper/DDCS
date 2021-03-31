/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";
import * as ddcsController from "../action/unitDetection";
import {I18nResolver} from "i18n-ts";

export async function reloadSAM(unitCalling: typing.IUnit): Promise<boolean> {
    const curPlayerArray = await ddcsControllers.srvPlayerActionsRead({name: unitCalling.playername});
    const curPly = curPlayerArray[0];
    const engineCache = ddcsControllers.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
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
                    await ddcsControllers.spawnUnitGroup(samUnits, false);
                    return true;
                } else {
                    await ddcsControllers.sendMesgToGroup(
                        unitCalling.groupId,
                        "G: " + i18n.TOODAMAGEDTOBERELOADED.replace("#1", curSamType),
                        5
                    );
                    return false;
                }
            }
        } else {
            await ddcsControllers.sendMesgToGroup(
                unitCalling.groupId,
                "G: " + i18n.DOESNOTHAVEENOUGHPIECES,
                5
            );
            return false;
        }
    } else {
        await ddcsControllers.sendMesgToGroup(
            unitCalling.groupId,
            "G: " + i18n.THEREARENOUNITSCLOSEENOUGHTORELOAD,
            5
        );
        return false;
    }
    return false;
}
