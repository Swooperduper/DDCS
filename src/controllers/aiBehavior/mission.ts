import * as _ from "lodash";
import * as ddcsController from "../";

export async function killEnemyWithinSightOfConvoy(): Promise<void> {
    // get first unit of all aiConvoys
    // const aiGroundUnits = await ddcsController.unitActionRead({dead: false, _id: /AI\|EDPathfindingPOS1\|\S*\|1\|/});
    const aiGroundUnits = await ddcsController.unitActionRead({dead: false, _id: /DU\|3c6b625a002627844e68a5cd0c11fbd1\|Leclerc\|\|true\|true\|NIGHTMARE 1-1 \| REPTAR\|6480840/});

    if (aiGroundUnits.length > 0) {
        for (const unit of aiGroundUnits) {
            const unitsInRange = await ddcsController.getGroundKillInProximity(unit.lonLatLoc, 4, ddcsController.enemySide[unit.coalition]);

            if (unitsInRange.length > 0) {
                const routes: any = {};
                const closestEnemyUnit = unitsInRange[0];
                routes.speed = "20";
                routes.routeLocs.push(unit.lonLatLoc);
                routes.routeLocs.push(
                    ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, closestEnemyUnit.hdg, 0.05)
                );
                routes.routeLocs.push(
                    ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 90) % 360, 0.05)
                );
                routes.routeLocs.push(
                    ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 90) % 360, 0.05)
                );
                routes.routeLocs.push(
                    ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, (closestEnemyUnit.hdg + 90) % 360, 0.05)
                );
                routes.routeLocs.push(closestEnemyUnit.lonLatLoc);

                const spawnTemplate = await ddcsController.templateRead({_id: "missionGroundMDKCircle"});
                const compiled = _.template(spawnTemplate[0].template);

                await ddcsController.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "addTask",
                        taskType: "Mission",
                        groupName: unit.groupName,
                        route: compiled({routes}),
                        reqID: 0
                    }
                });

            }
        }
    }
}
