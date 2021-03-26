/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {IUnit} from "../../typings";

const displayGCIOutputs = 5; // how many output lines on GCI output
const maxKMDistanceToRead = 161; // about 100 miles

export async function getAllEWRUnitNames(): Promise <string[]> {
    const engineCache = ddcsController.getEngineCache();
    const gciUnits = await ddcsController.unitActionRead({dead: false, type: {$in: engineCache.config.GCIDetectTypes}});
    return gciUnits.map((u: IUnit) => u.name);
}

export async function processGCIDetection(incomingObj: any): Promise<void> {
    const dedupeDetectedUnitNames = _.uniq(incomingObj.detectedUnitNames);
    if (dedupeDetectedUnitNames.length > 0) {
        // enemy detected, process
        const detectedUnits = await ddcsController.unitActionRead({
            dead: false,
            _id: {$in: dedupeDetectedUnitNames}
        });
        const sortByThreat = detectedUnits.sort((a, b) => (a.threatLvl > b.threatLvl) ? 1 : -1);

        const sideStack = ddcsController.checkRealtimeSideBalance();
        // console.log("sidestack: ", sideStack);

        if (sideStack.underdog === 1) {
            const enemyBlue = sortByThreat.filter((du) => du.coalition === 2);
            await gciUpdatePilots(enemyBlue, 1);
        }

        if (sideStack.underdog === 2) {
            const enemyRed = sortByThreat.filter((du) => du.coalition === 1);
            await gciUpdatePilots(enemyRed, 2);
        }
    } else {
        console.log("No detected units");
    }
}

export async function gciUpdatePilots(detectedUnits: any, friendlySide: number) {
    // pull up all player units to loop through (that doesnt have GCI off, menu option in f10)
    // console.log("SIDE: ", friendlySide, "DET: ", detectedUnits);
    const playerArray = ddcsController.getRTPlayerArray();
    const curPlayerDistance: IUnit[] = [];

    for (const player of playerArray) {
        const curPlayerUnits: IUnit[] = await ddcsController.unitActionRead({
            dead: false,
            coalition: friendlySide,
            playername: player.name
        });

        if (curPlayerUnits.length > 0) {
            const curPlayerUnit = curPlayerUnits[0];
            for (const unit of detectedUnits) {
                const distanceTo = ddcsController.calcDirectDistanceInKm(
                    curPlayerUnit.lonLatLoc[1],
                    curPlayerUnit.lonLatLoc[0],
                    unit.lonLatLoc[1],
                    unit.lonLatLoc[0]);

                let curEnemyAspect: string = "";

                if ( unit.hdg > 340 || unit.hdg <= 20 ) {
                    curEnemyAspect = "HOT";
                } else if ((unit.hdg > 20 && unit.hdg <= 60) || (unit.hdg > 300 && unit.hdg <= 340 )) {
                    curEnemyAspect = "FLANK";
                } else if ((unit.hdg > 60 && unit.hdg <= 110) || (unit.hdg > 250 && unit.hdg <= 300 )) {
                    curEnemyAspect = "BEAM";
                } else if (unit.hdg > 110 && unit.hdg <= 250) {
                    curEnemyAspect = "DRAG";
                }

                // console.log("DT: ", distanceTo, " <= ", maxKMDistanceToRead, unit);
                if (distanceTo <= maxKMDistanceToRead) {
                    curPlayerDistance.push({
                        ...unit,
                        bearingTo: ddcsController.findBearing(
                            curPlayerUnit.lonLatLoc[1],
                            curPlayerUnit.lonLatLoc[0],
                            unit.lonLatLoc[1],
                            unit.lonLatLoc[0]
                        ),
                        distanceTo,
                        curEnemyAspect

                    });
                }
            }

            if (curPlayerDistance.length > 0) {
                let mesg: string = `Automated GCI\n`;
                for ( let x = 0; x < displayGCIOutputs; x++) {
                    // F15, BRA 217 FOR 60M, AT 14000FT, DRAG
                    if (!!curPlayerDistance[x]) {
                        const curUnit = curPlayerDistance[x];
                        if (x !== 0) {
                            mesg += `\n`;
                        }
                        mesg += `${curUnit.type.toUpperCase()}, BRAA ${curUnit.bearingTo.toFixed(0)} FOR ${(curUnit.distanceTo * 0.621371).toFixed(0)}M, at ${(curUnit.alt * 3.28084).toFixed(0)}FT, ${curUnit.curEnemyAspect}`;
                    }
                }
                await ddcsController.sendMesgToGroup(curPlayerUnit.groupId, mesg, 15);
            }
        }
    }
}

export async function getAllDetectedUnitsByNameArray(): Promise<void> {

    const ewrNames = await getAllEWRUnitNames();

    const curNextUniqueId = ddcsController.getNextUniqueId();
    ddcsController.setRequestJobArray({
        reqId: curNextUniqueId,
        callBack: "processGCIDetection",
        reqArgs: {
            ewrNames
        }
    }, curNextUniqueId);
    await ddcsController.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "processGCIDetectionByName",
            ewrNames,
            reqID: curNextUniqueId
        }
    });
}
