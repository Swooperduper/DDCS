/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {IUnitDictionary, IWeaponDictionary} from "../../typings";

export async function detectHarmShot(event: any) {

    // console.log("detect harm: ", event.data);
    if (event && event.data && event.data.weapon && event.data.weapon.typeName) {
        const engineCache = ddcsController.getEngineCache();
        const getWeaponInfo = engineCache.weaponsDictionary.find((weapon: IWeaponDictionary) => weapon._id === event.data.weapon.typeName);

        // console.log("weapon detect: ", getWeaponInfo);
        if (getWeaponInfo && getWeaponInfo.isAntiRadiation) {
            const currentDetectedUnits = ddcsController.getEwrDetectionUnits();
            const initiatorUnits = await ddcsController.unitActionRead({dead: false, unitId: event.data.initiator.unitId});
            if (initiatorUnits.length > 0) {
                const curInitiator = initiatorUnits[0];
                const isUnitShotHarmDetected = currentDetectedUnits.find((unitName) => unitName === curInitiator._id);
                // console.log("is anti rad: ", isUnitShotHarmDetected, curInitiator._id, currentDetectedUnits);

                if (isUnitShotHarmDetected) {
                    // targetsCenter
                    let curTargetLonLat: number[] = [];
                    if (event.data.weapon.targetName) {
                        const targetUnits = await ddcsController.unitActionRead({dead: false, _id: event.data.weapon.targetName});
                        if (targetUnits.length > 0) {
                            curTargetLonLat = targetUnits[0].lonLatLoc;
                        }
                    } else if (event.data.weapon.impactPoint) {
                        curTargetLonLat = [event.data.weapon.impactPoint.lon, event.data.weapon.impactPoint.lat];
                    }

                    if (curTargetLonLat.length > 0) {
                        const localUnits = await ddcsController.getGroundUnitsInProximity(curTargetLonLat, 0.4, false);
                        // console.log("LocalUnits: ", localUnits, curTarget);
                        const friendlySAMs = localUnits.filter((unit) => {
                            const unitTypeDict = engineCache.unitDictionary.find((unitDict: IUnitDictionary) => unitDict._id === unit.type);
                            return unit.coalition === ddcsController.enemyCountry[curInitiator.coalition] &&
                                unitTypeDict.harmDetectChance > 0;
                        });
                        const maxPercentChanceOfGroup = _.max(
                            friendlySAMs.map(
                                (sam) => {
                                    const unitTypeDict = engineCache.unitDictionary
                                        .find((unitDict: IUnitDictionary) => unitDict._id === sam.type);
                                    return unitTypeDict.harmDetectChance;
                                }
                            )
                        );
						const randomNumber = _.random(1, 100);
                        const didRadarDetectHarm = maxPercentChanceOfGroup < randomNumber;
                        console.log("IAD friends: ", maxPercentChanceOfGroup, " < ", randomNumber, didRadarDetectHarm, maxPercentChanceOfGroup);
                        if (didRadarDetectHarm) {
                            const groupNameArray = _.uniq(friendlySAMs.map((sam) => sam.groupName));
                            for (const groupName of groupNameArray) {
                                console.log("goDark", groupName, friendlySAMs[0].type);
                                // harm detected radars in area around target go dark immediately (simulates radars general area fired at)
                                await ddcsController.sendUDPPacket("frontEnd", {
                                    actionObj: {
                                        action: "groupAIControl",
                                        aiCommand: "groupGoDark",
                                        groupName,
                                        reqID: 0
                                    }
                                });

                                // schedule go back online in 1 minute
                                await ddcsController.sendUDPPacket("frontEnd", {
                                    actionObj: {
                                        action: "groupAIControl",
                                        aiCommand: "groupGoLive",
                                        groupName,
                                        reqID: 0
                                    },
                                    timeToExecute: (new Date().getTime() + ddcsController.time.oneMin)
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}
