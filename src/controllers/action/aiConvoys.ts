/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../constants";
import * as masterDBController from "../db/masterDB";
import * as minutesPlayedController from "../action/minutesPlayed";
import * as groupController from "../spawn/group";

export async function maintainPvEConfig(serverName: any): Promise<any> {
    const promiseStack: any = [];
    return await exports.campaignStackTypes(serverName)
        .then((stackObj: any) => {
            let lockedStack: boolean;
            _.forEach(_.get(constants, "config.pveAIConfig", []), (pveConfig) => {
                lockedStack = false;
                _.forEach(_.get(pveConfig, "config", []), (aIConfig) => {
                    if (aIConfig.functionCall === "fullAIEnabled") {
                        exports.processAI(serverName, {underdog: 1}, aIConfig);
                        exports.processAI(serverName, {underdog: 2}, aIConfig);
                    } else {
                        const sideStackedAgainst = _.get(stackObj, [aIConfig.functionCall], {});
                        // get stats
                        // console.log('mt: ', sideStackedAgainst.ratio, ' >= ', aIConfig.stackTrigger);
                        if (sideStackedAgainst.ratio >= aIConfig.stackTrigger && !lockedStack) {
                            lockedStack = true;
                            // console.log('processing pveAI: ', aIConfig.desc);
                            return exports.processAI(serverName, sideStackedAgainst, aIConfig);
                        } else {
                            return true;
                        }
                    }
                });
            });
            return Promise.all(promiseStack);
        })
        .catch((err: any) => {
            console.log("err line24: ", err);
        });
}


export async function campaignStackTypes(serverName: string): Promise<any> {
    const promiseArray = [];
    const stackObj = {};
    promiseArray.push(minutesPlayedController.checkCurrentPlayerBalance(serverName)
        .then((sideStackedAgainst: any) => {
            _.set(stackObj, "fullCampaignStackStats", sideStackedAgainst);
        })
        .catch((err: any) => {
            console.log("err line37: ", err);
        }))
    ;
    return Promise.all(promiseArray)
        .then(() => {
            return stackObj;
        })
        .catch((err) => {
            console.log("err line53: ", err);
        });
}

export async function processAI(serverName: string, sideStackedAgainst: any, aIConfig: any): Promise<any> {
    console.log("sideStackedAgainst: ", sideStackedAgainst);
    if (sideStackedAgainst.underdog > 0) {
        return masterDBController.baseActions("read", serverName, {baseType: "MOB", side: sideStackedAgainst.underdog, enabled: true})
            .then((friendlyBases: any) => {
                exports.checkBasesToSpawnConvoysFrom(serverName, friendlyBases, aIConfig);
            })
            .catch((err: any) => {
                console.log("err line51: ", err);
            })
        ;
    }
}

export async function checkBasesToSpawnConvoysFrom(serverName: string, friendlyBases: any, aIConfig: any): Promise<any> {
    // console.log('convoyTest: ', serverName, aIConfig);
    _.forEach(friendlyBases, (base: any) => {
        _.forEach(_.get(base, ["polygonLoc", "convoyTemplate"]), (baseTemplate) => {
            // spawn ground convoys
            // 1 point route is a non-transversable route for ground units
            if (aIConfig.AIType === "groundConvoy" && _.get(baseTemplate, "route", []).length > 1) {
                masterDBController.baseActions("read", serverName, {
                    _id: _.get(baseTemplate, "destBase"),
                    side: _.get(constants, ["enemyCountry", _.get(base, "side", 0)]),
                    enabled: true
                })
                    .then((destBaseInfo: any) => {
                        if (destBaseInfo.length > 0) {
                            const curBase = _.first(destBaseInfo);
                            // check if convoy exists first
                            const baseConvoyGroupName = "AI|" + aIConfig.name +
                                "|" + _.get(baseTemplate, "sourceBase") +
                                "_" + _.get(baseTemplate, "destBase") + "|";
                            masterDBController.unitActions("read", serverName, {
                                groupName: baseConvoyGroupName,
                                isCrate: false,
                                dead: false
                            })
                                .then((convoyGroup: any) => {
                                    if (convoyGroup.length === 0) {
                                        // respawn convoy because it doesnt exist
                                        console.log("convoy ", _.get(base, "name"), " attacking ", _.get(curBase, "name"));
                                        const message = "C: A convoy just left " + _.get(base, "name") + " is attacking " + _.get(curBase, "name");
                                        groupController.spawnConvoy(
                                            serverName,
                                            baseConvoyGroupName,
                                            _.get(base, "side", 0),
                                            baseTemplate,
                                            aIConfig,
                                            message
                                        );
                                    }
                                })
                                .catch((err: any) => {
                                    console.log("err line94: ", err);
                                })
                            ;
                        }
                    })
                    .catch((err: any) => {
                        console.log("err line100: ", err);
                    })
                ;
            }
            if (aIConfig.AIType === "CAPDefense") {
                masterDBController.baseActions("read", serverName, {
                    _id: _.get(baseTemplate, "destBase"),
                    side: _.get(constants, ["enemyCountry", _.get(base, "side", 0)]),
                    enabled: true
                })
                    .then((destBaseInfo: any) => {
                        if (destBaseInfo.length > 0) {
                            const curBase = _.first(destBaseInfo);
                            // check if convoy exists first
                            const baseCapGroupName = "AI|" + aIConfig.name + "|" + _.get(base, "name") + "|";
                            masterDBController.unitActions("read", serverName, {
                                groupName: baseCapGroupName,
                                isCrate: false,
                                dead: false
                            })
                                .then((capGroup: any) => {
                                    if (capGroup.length === 0) {
                                        console.log("RESPAWNCAP: ", baseCapGroupName, capGroup.length);
                                        // respawn convoy because it doesnt exist
                                        const mesg = "C: A CAP Defense spawned at " + _.get(base, "name");
                                        groupController.spawnCAPDefense(
                                            serverName,
                                            baseCapGroupName,
                                            _.get(base, "side", 0),
                                            base,
                                            aIConfig,
                                            mesg
                                        );
                                    } else {
                                        console.log("skipCap: ", baseCapGroupName, capGroup.length);
                                    }
                                })
                                .catch((err: any) => {
                                    console.log("err line94: ", err);
                                })
                            ;
                        }
                    })
                    .catch((err: any) => {
                        console.log("err line100: ", err);
                    })
                ;
            }
        });
    });
}
