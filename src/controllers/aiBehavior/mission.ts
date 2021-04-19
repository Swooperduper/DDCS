import * as _ from "lodash";
import * as ddcsController from "../";
import * as ddcsControllers from "../action/aiConvoys";
import {getNextUniqueId, setRequestJobArray} from "../";
import {isNull} from "util";

const detectEnemyDistance = 10; // in km

export async function continueRoadRoute(
    incomingObj: any,
    reqId: any,
    reqArgs: any
): Promise<void> {
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
            reqID: 0
        }
    });
}

export async function killEnemyWithinSightOfConvoy(): Promise<void> {
    // get first unit of all aiConvoys
    console.log("KOS");
    const aiGroundUnits = await ddcsController.unitActionRead({
        dead: false,
        _id: /AI\|EDPathfindingPOS1\|\S*\|\S*\|1\|/
    });
    console.log("aiGroundLength: ", aiGroundUnits);
    /*
    const aiGroundUnits = await ddcsController.unitActionRead({
        dead: false,
        _id: "~Ground-1"
    });
    console.log("aiGroundLength: ", aiGroundUnits.length);
    */

    if (aiGroundUnits.length > 0) {
        for (const unit of aiGroundUnits) {

            // if pursuit expires and unit was pursuing, go back to road and continue
            if ((unit.pursuingUnit != null || unit.pursuingUnit !== "") &&
                new Date().getTime() > new Date(unit.pursueExpiration).getTime()) {

                const destBase = await ddcsController.baseActionRead({_id: unit._id.split("|")[3]});

                if (destBase.length > 0) {
                    await ddcsController.unitActionUpdate({
                        _id: unit._id,
                        pursuingUnit: null
                    }).catch((err: any) => { console.log("42", err); });

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
                    console.log("pursueEnemy: ", closestEnemyUnit);

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
                        await ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, closestEnemyUnit.hdg, 0.4)
                    );
                    routes.routeLocs.push(
                        ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 90) % 360, 0.4)
                    );
                    routes.routeLocs.push(
                        ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 180) % 360, 0.4)
                    );
                    routes.routeLocs.push(
                        ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 270) % 360, 0.4)
                    );
                    routes.routeLocs.push(closestEnemyUnit.lonLatLoc);

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
        }
    }
}
