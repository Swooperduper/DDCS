/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";

export async function checkUnitsToBaseForCapture(): Promise<void> {
    let sideArray = {};
    const campaignState: any = {
        red: 0,
        blue: 0
    };
    const bases = await ddcsControllers.baseActionRead({baseType: "MOB"});
    for (const base of bases) {
        const sideLabel: any = ddcsControllers.side[base.side];
        campaignState[sideLabel] += 1;
        const unitsInRange = await getGroundUnitsInProximity(base.centerLoc, 3, true);
        sideArray = _.transform(unitsInRange, (result: any[], value) => {
            (result[value.coalition] || (result[value.coalition] = [])).push(value);
        });
        if (base.side === 1 && _.get(sideArray, [2], []).length > 0) {
            // console.log('enemy in range: ', base.name + ': enemy Blue');
            if (_.get(sideArray, [1], []).length === 0) {
                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 2);
                await ddcsControllers.sendMesgToAll(
                    base.name + " HAS BEEN CAPTURED BY BLUE",
                    60
                );

                await ddcsControllers.spawnSupportBaseGrp(base.name, 2);
                await ddcsControllers.baseActionUpdateSide({name: base.name, side: 2});
                await ddcsControllers.setbaseSides();
                const aliveLogistics = await ddcsControllers.unitActionRead({name: base.name + " Logistics", dead: false});
                if (aliveLogistics.length > 0) {
                    // await ddcsControllers.spawnLogisticCmdCenter({}, false, base, 2);
                }
                const aliveComms = await ddcsControllers.unitActionRead({name: base.name + " Communications", dead: false});
                if (aliveComms.length > 0) {
                    await ddcsControllers.spawnRadioTower({}, false, base, 2);
                }
            }
        }
        if (base.side === 2 && _.get(sideArray, [1], []).length > 0) {
            // console.log('enemy in range: ', base.name + ': enemy Red');
            if (_.get(sideArray, [2], []).length === 0) {
                console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 1);
                await ddcsControllers.sendMesgToAll(
                    base.name + " HAS BEEN CAPTURED BY RED",
                    60
                );

                await ddcsControllers.spawnSupportBaseGrp(base.name, 1);
                await ddcsControllers.baseActionUpdateSide({name: base.name, side: 1});
                await ddcsControllers.setbaseSides();
                const aliveLogistics = await ddcsControllers.unitActionRead({name: base.name + " Logistics", dead: false});
                if (aliveLogistics.length > 0) {
                    // await ddcsControllers.spawnLogisticCmdCenter({}, false, base, 1);
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
            await ddcsControllers.sendMesgToAll(
                base.name + " HAS BEEN CAPTURED",
                60
            );
            // console.log('Spawning Support Units', base, unitSide);
            await ddcsControllers.spawnSupportBaseGrp(base.name, unitSide);
            await ddcsControllers.baseActionUpdateSide({name: base.name, side: unitSide});
            await ddcsControllers.setbaseSides();
            const aliveLogistics = await ddcsControllers.unitActionRead({name: base.name + " Logistics", dead: false});
            if (aliveLogistics.length > 0) {
                // await ddcsControllers.spawnLogisticCmdCenter({}, false, base, unitSide);
            }
            const aliveComms = await ddcsControllers.unitActionRead({name: base.name + " Communications", dead: false});
            if (aliveComms.length > 0) {
                await ddcsControllers.spawnRadioTower({}, false, base, unitSide);
            }
        }
    }
    if (!_.isEmpty(bases)) {
        if (campaignState.red === 0) {
            console.log("BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON ");
            await ddcsControllers.serverActionsUpdate({resetFullCampaign: true});
            await ddcsControllers.setTimeToRestart(new Date().getTime() + ddcsControllers.time.fiveMins);
            await ddcsControllers.sendMesgToAll(
                "Blue has won the campaign, Map will reset in 5 minutes.",
                ddcsControllers.time.fiveMins
            );
        }
        if (campaignState.blue === 0) {
            console.log("RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON ");
            await ddcsControllers.serverActionsUpdate({resetFullCampaign: true});
            await ddcsControllers.setTimeToRestart(new Date().getTime() + ddcsControllers.time.fiveMins);
            await ddcsControllers.sendMesgToAll(
                "Red has won the campaign, Map will reset in 5 minutes.",
                ddcsControllers.time.fiveMins
            );
        }
    }
}

export async function getCoalitionGroundUnitsInProximity(
    lonLat: number[],
    kmDistance: number,
    side: number
): Promise<typing.IUnit[]> {
    const catNum = ddcsControllers.UNIT_CATEGORY.indexOf("GROUND_UNIT");
    return await ddcsControllers.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: catNum,
            coalition: side
        });
}

export async function getMOBsInProximity(lonLat: number[], kmDistance: number, side: number): Promise<typing.IBase[]> {
    return await ddcsControllers.baseActionRead({
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

export async function getBasesInProximity(lonLat: number[], kmDistance: number, side: number): Promise<typing.IBase[]> {
    return await ddcsControllers.baseActionRead({
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

export async function getGroundUnitsInProximity(lonLat: number[], kmDistance: number, isTroop: boolean): Promise<typing.IUnit[]> {
    const catNum = ddcsControllers.UNIT_CATEGORY.indexOf("GROUND_UNIT");
    return await ddcsControllers.unitActionReadStd({
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
        category: catNum,
        isCrate: false,
        isTroop
    });
}

export async function getLogiTowersProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<typing.IUnit[]> {
    const catNum = ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE");
    return await ddcsControllers.unitActionRead({
            dead: false,
            lonLatLoc: {
                $geoWithin: {
                    $centerSphere: [
                        lonLat,
                        kmDistance / 6378.1
                    ]
                }
            },
            category: catNum,
            proxChkGrp: "logisticTowers",
            coalition
        });
}

export async function getPlayersInProximity(
    lonLat: number[],
    kmDistance: number,
    inAir: boolean,
    coalition: number
): Promise<typing.IUnit[]> {
    return await ddcsControllers.unitActionRead({
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
): Promise<typing.ICrate[]> {
    return await ddcsControllers.staticCrateActionReadStd({
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

export async function getTroopsInProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<typing.IUnit[]> {
    return await ddcsControllers.unitActionReadStd({
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
): Promise<typing.IUnit[]> {
    return await ddcsControllers.unitActionReadStd({
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
    const chkPlayers = await ddcsControllers.unitActionRead({
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
