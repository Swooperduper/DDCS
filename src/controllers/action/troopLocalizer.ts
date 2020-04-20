/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as masterDBController from "../db";
import * as proximityController from "../proxZone/proximity";
import * as groupController from "../spawn/group";

export async function checkTroopProx() {
    masterDBController.unitActionRead({isTroop: true, dead: false})
        .then((troopUnits) => {
            _.forEach(troopUnits, (troop) => {
                const stParse = _.split(troop.name, "|");
                const playerName = stParse[3];
                proximityController.isPlayerInProximity(troop.lonLatLoc, 1, playerName)
                    .then((isPlayerProximity) => {
                        console.log(
                            "Destroying " + playerName + "s " + troop.type + " has been destroyed due to proximity",
                            isPlayerProximity,
                            !isPlayerProximity
                        );
                        if (!isPlayerProximity) {
                            groupController.destroyUnit(troop.name);
                        }
                    })
                    .catch((err) => {
                        console.log("erroring line162: ", err);
                    });
            });
        })
        .catch((err) => {
            console.log("erroring line162: ", err);
        });
}
