import * as _ from "lodash";
import * as ddcsController from "../";

export async function killEnemyWithinSightOfConvoy(): Promise<void> {
    // get first unit of all aiConvoys
	console.log("KOS");
    // const aiGroundUnits = await ddcsController.unitActionRead({dead: false, _id: /AI\|EDPathfindingPOS1\|\S*\|1\|/});
    const aiGroundUnits = await ddcsController.unitActionRead({dead: false, _id: /DU\|3c6b625a002627844e68a5cd0c11fbd1\|Leclerc\|\|true\|true\|NIGHTMARE 1-1 \| REPTAR\|6480840/});
	console.log("UIR1: ", aiGroundUnits);
    if (aiGroundUnits.length > 0) {
        for (const unit of aiGroundUnits) {
			console.log("AI1: ", unit.lonLatLoc, 4, ddcsController.enemySide[unit.coalition]);
            const unitsInRange = await ddcsController.getGroundKillInProximity(unit.lonLatLoc, 4, ddcsController.enemySide[unit.coalition]);
			console.log("UIR2: ", unitsInRange);
            if (unitsInRange.length > 0) {
				console.log("UIR3: ", unitsInRange);
                const routes: any = {
					speed: "20",
					routeLocs: []
				};
				console.log("UIR4: ", routes);
                const closestEnemyUnit = unitsInRange[0];
				console.log("UIR5: ", closestEnemyUnit);
                routes.speed = "20";
                routes.routeLocs.push(unit.lonLatLoc);
				console.log("HH: ", routes);
                routes.routeLocs.push(
                    await ddcsController.getLonLatFromDistanceDirection(closestEnemyUnit.lonLatLoc, closestEnemyUnit.hdg, 0.05)
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

				console.log("mission: ", {
                        action: "addTask",
                        taskType: "Mission",
                        groupName: unit.groupName,
                        route: compiled({routes}),
                        reqID: 0
                    });
				
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
