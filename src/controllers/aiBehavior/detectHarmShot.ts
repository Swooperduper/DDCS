/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";
import {IWeaponDictionary} from "../../typings";

export async function detectHarmShot(event: any) {

	console.log("detect harm: ", event.data);
    if (event && event.data && event.data.weapon && event.data.weapon.targetName && event.data.weapon.typeName) {
        const engineCache = ddcsController.getEngineCache();
        const getWeaponInfo = engineCache.weaponsDictionary.find((weapon: IWeaponDictionary) => weapon._id === event.data.weapon.typeName );

		console.log("weapon detect: ", getWeaponInfo);
        if (getWeaponInfo && getWeaponInfo.isAntiRadiation) {
            const currentDetectedUnits = ddcsController.getEwrDetectionUnits();
			const initiatorUnits = await ddcsController.unitActionRead({dead: false, unitId: event.data.initiator.unitId});
			if (initiatorUnits.length > 0) {
				const curInitiator = initiatorUnits[0];
				const isUnitShotHarmDetected = currentDetectedUnits.find((unitName) => unitName === curInitiator._id);
				console.log("is anti rad: ", isUnitShotHarmDetected, curInitiator._id, currentDetectedUnits);

				if (isUnitShotHarmDetected) {
					const targetUnits = await ddcsController.unitActionRead({dead: false, _id: event.data.weapon.targetName});
					if (targetUnits.length > 0) {
						const curTarget = targetUnits[0];
						const localUnits = await ddcsController.getGroundUnitsInProximity(curTarget.lonLatLoc, 0.1, false);
						const friendlySAMs = localUnits.filter((unit) => {
							return unit.coalition === curTarget.coalition && unit.harmDetectChance > 0;
						});
						const maxPercentChanceOfGroup = _.max(friendlySAMs.map((sam) => sam.harmDetectChance));
						const didRadarDetectHarm = (maxPercentChanceOfGroup || 0) > _.random(0, 100);
						console.log("did radar detect harm: ", didRadarDetectHarm, curTarget, maxPercentChanceOfGroup, friendlySAMs.map((sam) => sam.harmDetectChance), friendlySAMs);
						if (didRadarDetectHarm) {
							const groupNameArray = friendlySAMs.map((sam) => sam.groupName);
							for (const groupName of groupNameArray) {
								console.log("goDark", groupNameArray);
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
