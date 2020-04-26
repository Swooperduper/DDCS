/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db";
import * as jtacController from "../action/jtac";
import * as groupController from "../spawn/group";
import * as userLivesController from "../action/userLives";
import * as weaponComplianceController from "../action/weaponCompliance";
import * as neutralCCController from "../action/neutralCC";
import * as resetCampaignController from "../action/resetCampaign";
// import * as aiConvoysController from "../action/aiConvoys";

const aIMaxIdleTime = (5 * 60 * 1000); // 5 mins
const maxCrateLife = (3 * 60 * 60 * 1000); // 3 hrs

export async function processThirtySecActions(fullySynced: boolean) {
    if (fullySynced) {

        masterDBController.unitActionRemoveAllDead({})
            .catch((err) => {
                console.log("err line12: ", err);
            })
        ;
        resetCampaignController.checkTimeToRestart();
        if (constants.config.lifePointsEnabled) {
            userLivesController.checkAircraftCosts();
        }

        weaponComplianceController.checkAircraftWeaponCompliance();

        jtacController.aliveJtac30SecCheck();
        // troopLocalizerController.checkTroopProx(serverName);

        neutralCCController.checkCmdCenters();

        // cleanupAI aIMaxIdleTime
        masterDBController.unitActionRead({isAI: true, dead: false})
            .then((aICleanup: any) => {
                _.forEach(aICleanup, (aIUnit: any) => {
                    if (_.isEmpty(aIUnit.playername) && new Date(aIUnit.updatedAt).getTime() + aIMaxIdleTime < new Date().getTime()) {
                        groupController.destroyUnit( aIUnit.name );
                    }
                });
            })
            .catch((err) => {
                console.log("err line20: ", err);
            });

        masterDBController.staticCrateActionReadStd({})
            .then((crateCleanup) => {
                _.forEach(crateCleanup, (crate) => {
                    if (new Date(crate.createdAt).getTime() + maxCrateLife < new Date().getTime()) {
                        masterDBController.staticCrateActionDelete({_id: crate._id})
                            .then(() => {
                                console.log("cleanup crate: ", crate.name);
                                groupController.destroyUnit( crate.name );
                            })
                            .catch((err) => {
                                console.log("line 56: ", err);
                            })
                        ;
                    }
                });
            })
            .catch((err) => {
                console.log("err line63: ", err);
            });
    }
}
