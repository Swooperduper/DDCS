/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

export async function baseUnitUnderAttack(unit: typings.IUnit): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    if (ddcsControllers.UNIT_CATEGORY[unit.unitCategory] === "GROUND_UNIT") {
        const closestBases = await ddcsControllers.getBasesInProximity(unit.lonLatLoc, 18, unit.coalition);
        if (closestBases) {
            const curDBBase = closestBases[0];
            const aliveComms = await ddcsControllers.unitActionRead({name: curDBBase.name + " Comms tower M", dead: false});
            if (aliveComms.length > 0) {
                const curBase = _.find(engineCache.bases, {_id: curDBBase._id});
                if (curBase) {
                    curBase.underAttack += 1;
                    console.log(curBase.name + " is under attack");
                }
            }
        }
    }
}

export async function checkBaseWarnings(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    for (const base of engineCache.bases) {
        if (base.underAttack > 0) {
            await ddcsControllers.sendMesgToCoalition(
                _.get(base, "side"),
                "BASEISUNDERATTACK",
                [_.get(base, "name")],
                20
            );
            base.underAttack = 0;
        }
    }
}
