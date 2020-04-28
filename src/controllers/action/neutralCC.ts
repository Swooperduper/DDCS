/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function checkCmdCenters(): Promise<void> {
    let basesChanged = false;
    let curSide;
    const bases = await ddcsController.baseActionRead({baseType: "FOB", enabled: true});
    for (const base of bases) {
        const isCCExist = await ddcsController.unitActionRead({_id: base.name + " Logistics", dead: false});
        if (isCCExist.length > 0) {
            curSide = isCCExist[0].coalition;
            if (_.get(base, "side") !== curSide) {
                basesChanged = true;
                await ddcsController.baseActionUpdateSide({name: base.name, side: curSide})
                    .catch((err: any) => {
                        console.log("erroring line162: ", err);
                    });
            }
        } else {
            if (base.side !== 0) {
                basesChanged = true;
                await ddcsController.baseActionUpdateSide({name: base.name, side: 0})
                    .catch((err: any) => {
                        console.log("erroring line162: ", err);
                    })
                ;
            }
        }
    }
    if (basesChanged) {
        await ddcsController.setbaseSides();
    }
}

export async function spawnCCAtNeutralBase(curPlayerUnit: ddcsController.IUnit): Promise<boolean> {
    const bases = await ddcsController.baseActionRead({baseType: "FOB", enabled: true});
    const mainNeutralBases = _.remove(bases, (base) => {
        return !_.includes(base.name, "#");
    });

    for ( const base of mainNeutralBases) {
        const unitsInProx = await ddcsController.getPlayersInProximity(base.centerLoc, 3.4, false, curPlayerUnit.coalition);
        if (_.find(unitsInProx, {playername: curPlayerUnit.playername})) {
            const cmdCenters = await ddcsController.unitActionRead({_id: base.name + " Logistics", dead: false});
            if (cmdCenters.length > 0) {
                console.log("player own CC??: " + (cmdCenters[0].coalition === curPlayerUnit.coalition));
                if (cmdCenters[0].coalition === curPlayerUnit.coalition) {
                    console.log("cmdCenter already exists, replace units: " + base.name + " " + cmdCenters);
                    await ddcsController.sendMesgToGroup(
                        curPlayerUnit.groupId,
                        "G: " + base.name + " Command Center Already Exists, Support Units Replaced.",
                        5
                    );
                    // console.log('SSB: ', serverName, base.name, curPlayerUnit.coalition);
                    await ddcsController.spawnSupportBaseGrp(base.name, curPlayerUnit.coalition);
                    return false;
                } else {
                    console.log(" enemy cmdCenter already exists: " + base.name + " " + cmdCenters);
                    await ddcsController.sendMesgToGroup(
                        curPlayerUnit.groupId,
                        "G: Enemy " + base.name + " Command Center Already Exists.",
                        5
                    );
                    return false;
                }
            } else {
                console.log("cmdCenter doesnt exist " + base.name);
                await ddcsController.spawnLogisticCmdCenter({}, false, base, curPlayerUnit.coalition);
                await ddcsController.baseActionUpdateSide({name: base.name, side: curPlayerUnit.coalition});
                await ddcsController.setbaseSides();
                await ddcsController.spawnSupportBaseGrp(base.name, curPlayerUnit.coalition);
                await ddcsController.sendMesgToCoalition(
                    curPlayerUnit.coalition,
                    "C: " + base.name + " Command Center Is Now Built!",
                    20
                );
                return true;
            }
        }
    }
    return false;
}
