/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function checkUnitsToBaseForCapture(): Promise<void> {
    let sideArray = {};
    const campaignState: any = {
        red: 0,
        blue: 0
    };
    const bases = await ddcsController.baseActionRead({baseType: "MOB"});
    for (const base of bases) {
        const sideLabel: any = ddcsController.side[base.side];
        campaignState[sideLabel] += 1;
        const unitsInRange = await getGroundUnitsInProximity(base.centerLoc, 3, true);
        sideArray = _.transform(unitsInRange, (result: any[], value) => {
            (result[value.coalition] || (result[value.coalition] = [])).push(value);
        });
        if (base.side === 1 && _.get(sideArray, [2], []).length > 0) {
            // console.log('enemy in range: ', base.name + ': enemy Blue');
            if (_.get(sideArray, [1], []).length === 0) {
                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 2);
                await ddcsController.sendMesgToAll(
                    base.name + " HAS BEEN CAPTURED BY BLUE",
                    60
                );

                await ddcsController.spawnSupportBaseGrp(base.name, 2);
                await ddcsController.baseActionUpdateSide({name: base.name, side: 2});
                await ddcsController.setbaseSides();
                const aliveLogistics = await ddcsController.unitActionRead({name: base.name + " Logistics", dead: false});
                if (aliveLogistics.length > 0) {
                    await ddcsController.spawnLogisticCmdCenter({}, false, base, 2);
                }
                const aliveComms = await ddcsController.unitActionRead({name: base.name + " Communications", dead: false});
                if (aliveComms.length > 0) {
                    await ddcsController.spawnRadioTower({}, false, base, 2);
                }
            }
        }
        if (base.side === 2 && _.get(sideArray, [1], []).length > 0) {
            // console.log('enemy in range: ', base.name + ': enemy Red');
            if (_.get(sideArray, [2], []).length === 0) {
                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 1);
                await ddcsController.sendMesgToAll(
                    base.name + " HAS BEEN CAPTURED BY RED",
                    60
                );

                await ddcsController.spawnSupportBaseGrp(base.name, 1);
                await ddcsController.baseActionUpdateSide({name: base.name, side: 1});
                await ddcsController.setbaseSides();
                const aliveLogistics = await ddcsController.unitActionRead({name: base.name + " Logistics", dead: false});
                if (aliveLogistics.length > 0) {
                    await ddcsController.spawnLogisticCmdCenter({}, false, base, 1);
                }
            }
        }
        if (base.side === 0 && (_.get(sideArray, [1], []).length > 0 || _.get(sideArray, [2], []).length > 0)) {
            let unitSide = 0;
            if (_.get(sideArray, [1], []).length > 0) {
                unitSide = 1;
            }
            if (_.get(sideArray, [2], []).length > 0) {
                unitSide = 2;
            }
            console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", unitSide);
            await ddcsController.sendMesgToAll(
                base.name + " HAS BEEN CAPTURED",
                60
            );
            // console.log('Spawning Support Units', base, unitSide);
            await ddcsController.spawnSupportBaseGrp(base.name, unitSide);
            await ddcsController.baseActionUpdateSide({name: base.name, side: unitSide});
            await ddcsController.setbaseSides();
            const aliveLogistics = await ddcsController.unitActionRead({name: base.name + " Logistics", dead: false});
            if (aliveLogistics.length > 0) {
                await ddcsController.spawnLogisticCmdCenter({}, false, base, unitSide);
            }
            const aliveComms = await ddcsController.unitActionRead({name: base.name + " Communications", dead: false});
            if (aliveComms.length > 0) {
                await ddcsController.spawnRadioTower({}, false, base, unitSide);
            }
        }
    }
    if (!_.isEmpty(bases)) {
        if (campaignState.red === 0 && !ddcsController.lockUpdates) {
            console.log("BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON ");
            await ddcsController.serverActionsUpdate({resetFullCampaign: true});
            await ddcsController.setLockUpdates(true);
            await ddcsController.setTimeToRestart(new Date().getTime() + ddcsController.time.fiveMins);
            await ddcsController.sendMesgToAll(
                "Blue has won the campaign, Map will reset in 5 minutes.",
                ddcsController.time.fiveMins
            );
        }
        if (campaignState.blue === 0 && !ddcsController.lockUpdates) {
            console.log("RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON ");
            await ddcsController.serverActionsUpdate({resetFullCampaign: true});
            await ddcsController.setLockUpdates(true);
            await ddcsController.setTimeToRestart(new Date().getTime() + ddcsController.time.fiveMins);
            await ddcsController.sendMesgToAll(
                "Red has won the campaign, Map will reset in 5 minutes.",
                ddcsController.time.fiveMins
            );
        }
    }
}

export async function getCoalitionGroundUnitsInProximity(
    lonLat: number[],
    kmDistance: number,
    side: number
): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: "GROUND",
            coalition: side
        });
}

export async function getMOBsInProximity(lonLat: number[], kmDistance: number, side: number): Promise<ddcsController.IBase[]> {
    return await ddcsController.baseActionRead({
            centerLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            side,
            enabled: true,
            baseType: "MOB"
        });
}

export async function getBasesInProximity(lonLat: number[], kmDistance: number, side: number): Promise<ddcsController.IBase[]> {
    return await ddcsController.baseActionRead({
            centerLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            side,
            enabled: true
        });
}

export async function getGroundUnitsInProximity(lonLat: number[], kmDistance: number, isTroop: boolean): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionReadStd({
        dead: false,
        lonLatLoc: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: (lonLat) ? lonLat : [0, 0]
                },
                $maxDistance: kmDistance * 1000
            }
        },
        category: "GROUND",
        isCrate: false,
        isTroop
    });
}

export async function getLogiTowersProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: "STRUCTURE",
            proxChkGrp: "logisticTowers",
            coalition
        });
}

export async function getPlayersInProximity(
    lonLat: number[],
    kmDistance: number,
    inAir: boolean,
    coalition: number
): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            playername: {
                $ne: ""
            },
            category: {
                $in: ["AIRPLANE", "HELICOPTER"]
            },
            inAir,
            coalition
        });
}

export async function getStaticCratesInProximity(
    lonLat: number[],
    kmDistance: number,
    coalition: number
): Promise<ddcsController.ICrate[]> {
    return await ddcsController.staticCrateActionReadStd({
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            coalition
        });
}

export async function getTroopsInProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionReadStd({
            dead: false,
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            playername: {
                $eq: ""
            },
            type: {
                $in: [
                    "Soldier M249",
                    "Infantry AK",
                    "Stinger manpad",
                    "Soldier M4",
                    "Paratrooper RPG-16",
                    "2B11 mortar",
                    "SA-18 Igla manpad"
                ]
            },
            coalition
        });
}

export async function getVirtualCratesInProximity(
    lonLat: number[],
    kmDistance: number,
    coalition: number
): Promise<ddcsController.IUnit[]> {
    return await ddcsController.unitActionReadStd({
            dead: false,
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            name : {
                $regex: /CU\|/
            },
            inAir: false,
            coalition
        });
}

export async function isPlayerInProximity(lonLat: number[], kmDistance: number, playerName: string): Promise<boolean> {
    const chkPlayers = await ddcsController.unitActionRead({
        dead: false,
        lonLatLoc: {
            $geoWithin: {
                $centerSphere: [
                    lonLat,
                    kmDistance / 6378.1
                ]
            }
        },
        playername: playerName
    });
    return chkPlayers.length > 0;
}
