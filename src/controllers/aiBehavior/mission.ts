import * as _ from "lodash";
import * as ddcsController from "../";
import {getNextUniqueId, setRequestJobArray} from "../";
import * as ddcsControllers from "../action/aiConvoys";

const detectEnemyDistance = 10; // in km

export async function continueRoadRoute(
    incomingObj: any,
    reqId: any,
    reqArgs: any
): Promise<void> {
    // console.log("RR: ", incomingObj.returnObj, incomingObj.returnObj.length, reqId, reqArgs);

    if (incomingObj.returnObj.length === 2) {
        const routes: any = {
            speed: "20",
            routeLocs: incomingObj.returnObj
        };
        const spawnTemplate = await ddcsController.templateRead({_id: "missionGround2Route"});
        const compiled = _.template(spawnTemplate[0].template);
        await ddcsController.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "addTask",
                groupName: reqArgs.groupName,
                mission: compiled({routes}),
                verbose: true,
                reqID: 0
            }
        });
    }
}

export async function aiDefendBase(): Promise<void> {
    // get first unit of all aiConvoys
    // console.log("KOS");
    const engineCache = ddcsController.getEngineCache();
    const getBaseDefenceUnitTypes = engineCache.unitDictionary.filter((unit: any) => unit.mobileBaseDefense);

    const mainBaseMOBs = await ddcsController.baseActionRead({baseType: "MOB", _id: { $not: /~/ }, enabled: true});
    for (const base of mainBaseMOBs) {
        const baseUnitNameRegex = new RegExp(base._id + " #");
        const aiBaseDefense = await ddcsController.unitActionRead({
            dead: false,
            _id: baseUnitNameRegex,
            type: {$in: getBaseDefenceUnitTypes}
        });

        const firstUnitEachGroup = aiBaseDefense.filter((unit) => {
            return unit.groupName === unit.name;
        });

        if (firstUnitEachGroup.length > 0) {
            for (const unit of firstUnitEachGroup) {
                // if pursuit expires and unit was pursuing, go back to road and continue
                if (!!unit.pursuingUnit && new Date().getTime() > new Date(unit.pursueExpiration).getTime()) {
                    console.log(unit.name, " return to base, ", base._id);

                    const newBaseParkingSpot = ddcsController.getRandomLatLonFromBase(base.name, "unitPoly");

                    if (newBaseParkingSpot.length === 2) {

                        await ddcsController.unitActionUpdate({
                            _id: unit._id,
                            pursuingUnit: null
                        }).catch((err: any) => { console.log("66", err); });

                        /*
                        await ddcsController.unitActionUpdate({
                            _id: unit.pursuingUnit,
                            pursuedByEnemyUnit: null
                        }).catch((err: any) => { console.log("72", err); });
                        */

                        const routes: any = {
                            speed: "20",
                            routeLocs: [
                                unit.lonLatLoc,
                                [newBaseParkingSpot[0], newBaseParkingSpot[1]]
                            ]
                        };
                        const spawnTemplate = await ddcsController.templateRead({_id: "missionGroundProtectBase"});
                        const compiled = _.template(spawnTemplate[0].template);
                        await ddcsController.sendUDPPacket("frontEnd", {
                            actionObj: {
                                action: "addTask",
                                groupName: unit.groupName,
                                mission: compiled({routes}),
                                verbose: true,
                                reqID: 0
                            }
                        });
                    }
                } else {
                    if (!unit.pursuingUnit) {
                        /*
                        console.log("check range: ", unit.lonLatLoc,
                            detectEnemyDistance, ddcsController.enemySide[unit.coalition]);
                         */
                        const enemyUnitsInRange = await ddcsController.getGroundKillInProximity(
                            unit.lonLatLoc, detectEnemyDistance, ddcsController.enemySide[unit.coalition]
                        );

                        // if unit is pursuing, let it continue
                        const pursueWithExistingAttacker = enemyUnitsInRange.find(
                            (enemyUnit) => enemyUnit.pursuedByEnemyUnit === unit.name
                        );

                        // if nothing is pursuing enemy, send new pursuit
                        const removePursuedEnemy = enemyUnitsInRange.filter((enemyUnit) => !enemyUnit.pursuedByEnemyUnit);


                        // console.log("enemyInRange: ", removePursuedEnemy.length);
                        if (pursueWithExistingAttacker || removePursuedEnemy.length > 0) {
                            const closestEnemyUnit =  (pursueWithExistingAttacker) ? pursueWithExistingAttacker : removePursuedEnemy[0];

                            const routes: any = {
                                speed: "20",
                                routeLocs: []
                            };

                            console.log(unit.name, " is pursing enemy near base: ", base.name, closestEnemyUnit.name);

                            // update unit attacking
                            await ddcsController.unitActionUpdate({
                                _id: unit._id,
                                pursuingUnit: closestEnemyUnit._id,
                                pursueExpiration: new Date().getTime() + ddcsController.time.fiveMins
                            }).catch((err: any) => { console.log("42", err); });

                            // update unit getting attacked
                            await ddcsController.unitActionUpdate({
                                _id: closestEnemyUnit._id,
                                pursuedByEnemyUnit: unit._id,
                                pursueExpiration: new Date().getTime() + ddcsController.time.fiveMins
                            }).catch((err: any) => { console.log("49", err); });

                            routes.speed = "20";
                            routes.routeLocs.push(unit.lonLatLoc);
                            routes.routeLocs.push(
                                await ddcsController.getLonLatFromDistanceDirection(
                                    closestEnemyUnit.lonLatLoc,
                                    closestEnemyUnit.hdg,
                                    0.4
                                )
                            );
                            routes.routeLocs.push(
                                ddcsController.getLonLatFromDistanceDirection(
                                    closestEnemyUnit.lonLatLoc,
                                    (closestEnemyUnit.hdg + 90) % 360,
                                    0.4
                                )
                            );
                            routes.routeLocs.push(
                                ddcsController.getLonLatFromDistanceDirection(
                                    closestEnemyUnit.lonLatLoc,
                                    (closestEnemyUnit.hdg + 180) % 360,
                                    0.4
                                )
                            );
                            routes.routeLocs.push(
                                ddcsController.getLonLatFromDistanceDirection(
                                    closestEnemyUnit.lonLatLoc,
                                    (closestEnemyUnit.hdg + 270) % 360,
                                    0.4
                                )
                            );
                            routes.routeLocs.push(closestEnemyUnit.lonLatLoc);

                            // console.log("routeLocAmount: ", routes.routeLocs.length);

                            if (routes.routeLocs.length === 6) {
                                const spawnTemplate = await ddcsController.templateRead({_id: "missionGroundMDKCircle"});
                                const compiled = _.template(spawnTemplate[0].template);
                                await ddcsController.sendUDPPacket("frontEnd", {
                                    actionObj: {
                                        action: "addTask",
                                        groupName: unit.groupName,
                                        mission: compiled({routes}),
                                        reqID: 0
                                    }
                                });
                            }
                        }
                    } else {
                        console.log("Currently Pursuing: ", unit.pursuingUnit);
                    }
                }
            }
        }
    }
}

export async function killEnemyWithinSightOfConvoy(): Promise<void> {
    // get first unit of all aiConvoys
    // console.log("KOS");
    const aiGroundUnits = await ddcsController.unitActionRead({
        dead: false,
        _id: /AI\|EDPathfindingPOS1\|(.)*\|(.)*\|1\|/
    });
    // console.log("aiGroundLength: ", aiGroundUnits.map((unit) => unit.name));

    if (aiGroundUnits.length > 0) {
        for (const unit of aiGroundUnits) {
            // if pursuit expires and unit was pursuing, go back to road and continue
            if (!!unit.pursuingUnit && new Date().getTime() > new Date(unit.pursueExpiration).getTime()) {
                console.log(unit.name, " is breaking off of pursuit, ", unit.pursuingUnit);

                const destBase = await ddcsController.baseActionRead({_id: unit._id.split("|")[3]});

                if (destBase.length > 0) {
                    await ddcsController.unitActionUpdate({
                        _id: unit._id,
                        pursuingUnit: null
                    }).catch((err: any) => { console.log("204", err); });

                    await ddcsController.unitActionUpdate({
                        _id: unit.pursuingUnit,
                        pursuedByEnemyUnit: null
                    }).catch((err: any) => { console.log("209", err); });

                    // send back to aiConvoy Route

                    const curNextUniqueId = getNextUniqueId();
                    setRequestJobArray({
                        reqId: curNextUniqueId,
                        callBack: "continueRoadRoute",
                        reqArgs: {
                            groupName: unit.groupName
                        }
                    }, curNextUniqueId);
                    await ddcsController.sendUDPPacket("frontEnd", {
                        actionObj: {
                            action: "getGroundRoute",
                            type: "roads",
                            lat1: unit.lonLatLoc[1],
                            lon1: unit.lonLatLoc[0],
                            lat2: destBase[0].centerLoc[1],
                            lon2: destBase[0].centerLoc[0],
                            reqID: curNextUniqueId,
                            time: new Date()
                        }
                    });
                }
            } else {
                if (!unit.pursuingUnit) {
                    /*
                    console.log("check range: ", unit.lonLatLoc,
                        detectEnemyDistance, ddcsController.enemySide[unit.coalition]);
                     */
                    const unitsInRange = await ddcsController.getGroundKillInProximity(
                        unit.lonLatLoc, detectEnemyDistance, ddcsController.enemySide[unit.coalition]
                    );
                    console.log("enemyInRange: ", unitsInRange.length);
                    if (unitsInRange.length > 0) {
                        const routes: any = {
                            speed: "20",
                            routeLocs: []
                        };
                        const closestEnemyUnit = unitsInRange[0];
                        console.log(unit.name, " is pursing enemy: ", closestEnemyUnit.name);

                        // update unit attacking
                        await ddcsController.unitActionUpdate({
                            _id: unit._id,
                            pursuingUnit: closestEnemyUnit._id,
                            pursueExpiration: new Date().getTime() + ddcsController.time.fiveMins
                        }).catch((err: any) => { console.log("42", err); });

                        // update unit getting attacked
                        await ddcsController.unitActionUpdate({
                            _id: closestEnemyUnit._id,
                            pursuedByEnemyUnit: unit._id,
                            pursueExpiration: new Date().getTime() + ddcsController.time.fiveMins
                        }).catch((err: any) => { console.log("49", err); });

                        routes.speed = "20";
                        routes.routeLocs.push(unit.lonLatLoc);
                        routes.routeLocs.push(
                            await ddcsController.getLonLatFromDistanceDirection(
                                closestEnemyUnit.lonLatLoc,
                                closestEnemyUnit.hdg,
                                0.4
                            )
                        );
                        routes.routeLocs.push(
                            ddcsController.getLonLatFromDistanceDirection(
                                closestEnemyUnit.lonLatLoc,
                                (closestEnemyUnit.hdg + 90) % 360,
                                0.4
                            )
                        );
                        routes.routeLocs.push(
                            ddcsController.getLonLatFromDistanceDirection(
                                closestEnemyUnit.lonLatLoc,
                                (closestEnemyUnit.hdg + 180) % 360,
                                0.4
                            )
                        );
                        routes.routeLocs.push(
                            ddcsController.getLonLatFromDistanceDirection(
                                closestEnemyUnit.lonLatLoc,
                                (closestEnemyUnit.hdg + 270) % 360,
                                0.4
                            )
                        );
                        routes.routeLocs.push(closestEnemyUnit.lonLatLoc);

                        // console.log("routeLocAmount: ", routes.routeLocs.length);

                        if (routes.routeLocs.length === 6) {
                            const spawnTemplate = await ddcsController.templateRead({_id: "missionGroundMDKCircle"});
                            const compiled = _.template(spawnTemplate[0].template);
                            await ddcsController.sendUDPPacket("frontEnd", {
                                actionObj: {
                                    action: "addTask",
                                    groupName: unit.groupName,
                                    mission: compiled({routes}),
                                    reqID: 0
                                }
                            });
                        }
                    }
                } else {
                    console.log("Currently Pursuing: ", unit.pursuingUnit);
                }
            }
        }
    }
}
