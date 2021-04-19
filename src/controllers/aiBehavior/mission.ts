import * as _ from "lodash";
import * as ddcsController from "../";

const detectEnemyDistance = 10; // in km

export async function killEnemyWithinSightOfConvoy(): Promise<void> {
    // get first unit of all aiConvoys
    console.log("KOS");
    const aiGroundUnits = await ddcsController.unitActionRead({dead: false, _id: /AI\|EDPathfindingPOS1\|\S*\|1\|/});
    /*
    const aiGroundUnits = await ddcsController.unitActionRead({
        dead: false,
        _id: "~Ground-1"
    });
    console.log("aiGroundLength: ", aiGroundUnits.length);
*/

    if (aiGroundUnits.length > 0) {
        for (const unit of aiGroundUnits) {
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
