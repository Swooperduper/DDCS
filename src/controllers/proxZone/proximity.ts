/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";

export async function checkUnitsToBaseForCapture(): Promise<void> {
    // console.log("CHECK BASE CAPTURE");
    let sideArray = {};
    const engineCache = ddcsControllers.getEngineCache();
    const bases = await ddcsControllers.baseActionRead({baseType: "MOB"});
    for (const base of bases) {
        const unitsInRange = await getGroundUnitsInProximity(base.centerLoc, engineCache.config.baseCaptureProximity, true);
        sideArray = _.transform(unitsInRange, (result: any[], value) => {
            (result[value.coalition] || (result[value.coalition] = [])).push(value);
        });
        if (base.side === 1 && _.get(sideArray, [2], []).length > 0) {
            // console.log("enemy in range: ", base.name + ": enemy Blue");
            if (_.get(sideArray, [1], []).length === 0) {
                if (!_.includes(base.name, "#")) {
                    console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 2);
                    await ddcsControllers.sendMesgToAll(
                        "HASBEENCAPTUREDBY",
                        [base.name, "#" + 2],
                        60
                    );
                }

                await ddcsControllers.spawnSupportBaseGrp(base.name, 2, false);
                await ddcsControllers.baseActionUpdateSide({name: base.name, side: 2});
                // await ddcsControllers.setbaseSides();
                const aliveLogistics = await ddcsControllers.unitActionRead({_id: base.name + " Shelter", dead: false});
                if (aliveLogistics.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, 2, "Shelter");
                }
                const aliveComms = await ddcsControllers.unitActionRead({_id: base.name + " Comms tower M", dead: false});
                if (aliveComms.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, 2, "Comms tower M");
                }
                await ddcsControllers.setBaseCircleMark(base.name, 2);        
            }
        }
        if (base.side === 2 && _.get(sideArray, [1], []).length > 0) {
            // console.log("enemy in range: ", base.name + ": enemy Red");
            if (_.get(sideArray, [2], []).length === 0) {
                if (!_.includes(base.name, "#")) {
                    console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", 1);
                    await ddcsControllers.sendMesgToAll(
                        "HASBEENCAPTUREDBY",
                        [base.name, "#" + 1],
                        60
                    );
                }

                await ddcsControllers.spawnSupportBaseGrp(base.name, 1, false);
                await ddcsControllers.baseActionUpdateSide({name: base.name, side: 1});
                // await ddcsControllers.setbaseSides();
                const aliveLogistics = await ddcsControllers.unitActionRead({name: base.name + " Shelter", dead: false});
                if (aliveLogistics.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, 1, "Shelter");
                }
                const aliveComms = await ddcsControllers.unitActionRead({name: base.name + " Comms tower M", dead: false});
                if (aliveComms.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, 1, "Comms tower M");
                }
                await ddcsControllers.setBaseCircleMark(base.name, 1);
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
            if (_.get(sideArray, [1], []).length > 0 && _.get(sideArray, [2], []).length > 0) {
                unitSide = 0;
            }
            if(unitSide !== 0){
                if (!_.includes(base.name, "#")) {
                    console.log("BASE HAS BEEN CAPTURED: ", base.name, " is now ", unitSide);
                    await ddcsControllers.sendMesgToAll(
                        "HASBEENCAPTUREDBY",
                        [base.name],
                        60
                    );
                }

                // console.log('Spawning Support Units', base, unitSide);
                await ddcsControllers.spawnSupportBaseGrp(base.name, unitSide, false);
                await ddcsControllers.baseActionUpdateSide({name: base.name, side: unitSide});
                // await ddcsControllers.setbaseSides();
                const aliveLogistics = await ddcsControllers.unitActionRead({name: base.name + " Shelter", dead: false});
                if (aliveLogistics.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, unitSide, "Shelter");
                }
                const aliveComms = await ddcsControllers.unitActionRead({name: base.name + " Comms tower M", dead: false});
                if (aliveComms.length > 0) {
                    await ddcsControllers.spawnStaticBuilding({} as typing.IStaticSpawnMin, true, base, unitSide, "Comms tower M");
                }
            }
        }
    }

    const baseWinCondition = engineCache.config.mainCampaignBases;
    const warWon = await ddcsControllers.baseActionRead({_id: {$in: baseWinCondition}});

    if (!_.isEmpty(warWon)) {
        const campaignStateGroup = _.groupBy(warWon, "side");

        if (!campaignStateGroup[1]) {
            console.log("BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON BLUE WON ");
            await ddcsControllers.serverActionsUpdate({name: engineCache.config.name, resetFullCampaign: true});
            if (ddcsControllers.getTimeToRestart() === 0) {
                console.log("Setting TTR");
                await ddcsControllers.setTimeToRestart(new Date().getTime() + ddcsControllers.time.fiveMins);
            }
            await ddcsControllers.sendMesgToAll(
                "WONCAMPAIGNRESETSOON",
                ["#" + 2],
                5
            );
        }

        if (!campaignStateGroup[2]) {
            console.log("RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON RED WON ");
            await ddcsControllers.serverActionsUpdate({name: engineCache.config.name, resetFullCampaign: true});
            if (ddcsControllers.getTimeToRestart() === 0) {
                console.log("Setting TTR");
                await ddcsControllers.setTimeToRestart(new Date().getTime() + ddcsControllers.time.fiveMins);
            }
            await ddcsControllers.sendMesgToAll(
                "WONCAMPAIGNRESETSOON",
                ["#" + 1],
                5
            );
        }
    }
}

export async function getGroundKillInProximity(
    lonLat: number[],
    kmDistance: number,
    side: number
): Promise<typing.IUnit[]> {
    return await ddcsControllers.unitActionRead({
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
        unitCategory: {
            $in: [
                ddcsControllers.UNIT_CATEGORY.indexOf("HELICOPTER"),
                ddcsControllers.UNIT_CATEGORY.indexOf("GROUND_UNIT")
            ]
        },
        coalition: side
    });
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
            unitCategory: catNum,
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

export async function getAnyBasesInProximity(lonLat: number[], kmDistance: number): Promise<typing.IBase[]> {
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
        unitCategory: catNum,
        isCrate: false
    });
}

export async function getLogiTowersProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<typing.IUnit[]> {
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
            _id: /Shelter/,
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
            unitCategory: {
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
) {
    return await ddcsControllers.unitActionReadStd({
            lonLatLoc: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: lonLat
                    },
                    $maxDistance: kmDistance * 1000
                }
            },
            objectCategory: 6,
            dead: false,
            coalition
        });
}

export async function getFirst5CoalitionJTACInProximity(
    lonLat: number[],
    kmDistance: number,
    side: number
): Promise<typing.IUnit[]> {
    return await ddcsControllers.unitActionReadFirst5({
        dead: false,
        lonLatLoc: {
            $geoWithin: {
                $centerSphere: [
                    lonLat,
                    kmDistance / 6378.1
                ]
            }
        },
        proxChkGrp: "jtac",
        coalition: side,
        jtacEnemyLocation: {$ne: null}
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

export async function getPackableUnitsInProximity(lonLat: number[], kmDistance: number, coalition: number): Promise<typing.IUnit[]> {
    const engineCache = ddcsControllers.getEngineCache();
    const packableUnitsDicts = _.filter(engineCache.unitDictionary, {packable: true});
    const packableTypes: any[] = [];
    for (let unit of packableUnitsDicts){
        packableTypes.push(unit.type)
    }
    console.log("packableTypes:",packableTypes);
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
                $in: packableTypes
            },
            coalition
        });
}
