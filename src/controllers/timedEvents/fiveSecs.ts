/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db";
import * as proximityController from "../proxZone/proximity";
import * as groupController from "../spawn/group";
import * as resetCampaignController from "../action/resetCampaign";

export async function processFiveSecActions(fullySynced: boolean) {
    const replenThreshold = 1; // percentage under max
    const replenBase = constants.config.replenThresholdBase * replenThreshold;
    const replenTimer = _.random(constants.config.replenTimer / 2, constants.config.replenTimer);

    if (fullySynced) {
        // resetCampaignController.checkTimeToRestart(serverName); //for testing base capture quickly
        // set base flags
        masterDBController.baseActionRead({baseType: "MOB"})
            .then((bases) => {
                _.forEach(bases, (base) => {
                    const curRegEx = "^" + base._id + " #";
                    const unitCnt = replenBase;
                    masterDBController.unitActionRead({name: new RegExp(curRegEx), dead: false})
                        .then((units) => {
                            const replenEpoc = new Date(base.replenTime).getTime();
                            masterDBController.unitActionRead({name: base.name + " Communications", dead: false})
                                .then((aliveComms) => {
                                    if (aliveComms.length > 0) {
                                        if ((units.length < unitCnt) && replenEpoc < new Date().getTime()) { // UNCOMMENT OUT FALSE
                                            masterDBController.baseActionUpdateReplenTimer({
                                                name: base._id,
                                                replenTime: new Date().getTime() + (replenTimer * 1000)
                                            })
                                                .then(() => {
                                                    // console.log(serverName, base, base.side);
                                                    groupController.spawnSupportPlane(base, base.side);
                                                })
                                                .catch((err) => {
                                                    console.log("line 62: ", err);
                                                });
                                        }
                                    }
                                })
                                .catch((err) => {
                                    console.log("erroring line189: ", err);
                                });
                        })
                        .catch((err) => {
                            console.log("line 68: ", err);
                        });
                });
            })
            .catch((err) => {
                console.log("line51", err);
            });
        proximityController.checkUnitsToBaseForCapture();
    }
}
