/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {IUnit, IUnitDictionary} from "../../typings";
import {I18nResolver} from "i18n-ts";

const displayGCIOutputs = 5; // how many output lines on GCI output
const maxKMDistanceToRead = 161; // about 100 miles

let currentEWRDetectedUnits: string[] = [];

export function setEwrDetectionUnits(arrayOfNames: string[]): void {
    currentEWRDetectedUnits = arrayOfNames;
}

export function getEwrDetectionUnits(): string[] {
    return currentEWRDetectedUnits;
}

export async function getAllEWRUnitNames(): Promise <string[]> {
    const engineCache = ddcsController.getEngineCache();
    const gciUnits = await ddcsController.unitActionRead({dead: false, type: {$in: engineCache.config.GCIDetectTypes}});
    return gciUnits.map((u: IUnit) => u.name);
}

export async function processGCIDetection(incomingObj: any): Promise<void> {
    const engineCache = ddcsController.getEngineCache();

    const dedupeDetectedUnitNames = _.uniq(incomingObj.detectedUnitNames) as string[];

    setEwrDetectionUnits(dedupeDetectedUnitNames);

    if (dedupeDetectedUnitNames.length > 0) {
        // enemy detected, process
        const detectedUnits = await ddcsController.unitActionRead({
            dead: false,
            _id: {$in: dedupeDetectedUnitNames}
        });

        const unitsPlusThreat = [];

        if (detectedUnits.length > 0) {
            for (const detectedUnit of detectedUnits) {
                const dictionaryRecord = engineCache.unitDictionary.find((uD: IUnitDictionary) => uD._id === detectedUnit.type);
                if (!dictionaryRecord) {
                    console.log(detectedUnit.type, " doesnt have a dictionary record");
                } else {
                    detectedUnit.threatLvl = dictionaryRecord.threatLvl;
                    unitsPlusThreat.push(detectedUnit);
                }
            }

            const sortByThreat = unitsPlusThreat.sort((a, b) => (a.threatLvl > b.threatLvl) ? -1 : 1);

            const sideStack = ddcsController.checkRealtimeSideBalance();
            // console.log("sidestack: ", sideStack, dedupeDetectedUnitNames.length);

            if (sideStack.underdog === 1) {
                const enemyBlue = sortByThreat.filter((du) => du.coalition === 2);
                // console.log("enemyBlue: ", enemyBlue);
                await gciUpdatePilots(enemyBlue, 1);
            }

            if (sideStack.underdog === 2) {
                const enemyRed = sortByThreat.filter((du) => du.coalition === 1);
                // console.log("enemyBlue: ", enemyRed);
                await gciUpdatePilots(enemyRed, 2);
            }
        } else {
            console.log("Detected Units Not Alive");
        }
    } else {
        console.log("No detected units");
    }
}

export async function gciUpdatePilots(detectedUnits: any, friendlySide: number) {
    // pull up all player units to loop through (that doesnt have GCI off, menu option in f10)
    // console.log("SIDE: ", friendlySide, "DET: ", detectedUnits);
    const playerArray = ddcsController.getRTPlayerArray();

    for (const player of playerArray) {
        const curPlayerDistance: IUnit[] = [];
        const engineCache = ddcsController.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;

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
                    curEnemyAspect = i18n.HOT;
                } else if ((unit.hdg > 20 && unit.hdg <= 60) || (unit.hdg > 300 && unit.hdg <= 340 )) {
                    curEnemyAspect = i18n.FLANK;
                } else if ((unit.hdg > 60 && unit.hdg <= 110) || (unit.hdg > 250 && unit.hdg <= 300 )) {
                    curEnemyAspect = i18n.BEAM;
                } else if (unit.hdg > 110 && unit.hdg <= 250) {
                    curEnemyAspect = i18n.DRAG;
                }

                // console.log("DT: ", distanceTo, " <= ", maxKMDistanceToRead, unit.name);
                if (distanceTo <= maxKMDistanceToRead) {
                    // console.log("autoGCI: ", unit.type, unit.name, unit.coalition, distanceTo, " <= ", maxKMDistanceToRead);
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
                let message: string =  i18n.AUTOGCIHEADER + `\n`;
                for ( let x = 0; x < displayGCIOutputs; x++) {
                    // F15, BRA 217 FOR 60M, AT 14000FT, DRAG
                    if (!!curPlayerDistance[x]) {
                        const curUnit = curPlayerDistance[x];
                        if (x !== 0) {
                            message += `\n`;
                        }
                        message += `${curUnit.type.toUpperCase()}, ${i18n.BRAA} ${curUnit.bearingTo.toFixed(0)} ${i18n.FOR} ${(curUnit.distanceTo * 0.621371).toFixed(0)}${i18n.M}, ${i18n.AT} ${(curUnit.alt * 3.28084).toFixed(0)}${i18n.FT}, ${curUnit.curEnemyAspect}`;
                    }
                }
                //console.log("Auto GCI: ", curPlayerUnit.groupId, player.name, player.side, message);
                await ddcsController.sendMesgToGroup(player, curPlayerUnit.groupId, message, 15, 0);
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
