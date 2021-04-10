/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {getNextUniqueId, setRequestJobArray} from "../";

export async function maintainPvEConfig(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const stackObj: {fullCampaignStackStats: typings.IPlayerBalance} = await campaignStackTypes();
    let lockedStack: boolean;
    for (const pveConfig of engineCache.config.pveAIConfig) {
        lockedStack = false;
        for (const aIConfig of pveConfig.config) {
            if (aIConfig.functionCall === "fullAIEnabled") {
                await processAI({underdog: 1}, aIConfig);
                await processAI({underdog: 2}, aIConfig);
            } else {
                // @ts-ignore
                const sideStackedAgainst = stackObj[aIConfig.functionCall];
                if (sideStackedAgainst.ratio >= aIConfig.stackTrigger && !lockedStack) {
                    lockedStack = true;
                    await processAI(sideStackedAgainst, aIConfig);
                }
            }
        }
    }
}

export async function campaignStackTypes(): Promise<{fullCampaignStackStats: typings.IPlayerBalance}> {
    const sideStackedAgainst = await ddcsControllers.checkCurrentPlayerBalance();
    return { fullCampaignStackStats: sideStackedAgainst };
}

export async function processAI(sideStackedAgainst: {underdog: number}, aIConfig: typings.IAIConfig): Promise<void> {
    console.log("sideStackedAgainst: ", sideStackedAgainst);
    if (sideStackedAgainst.underdog > 0) {
        const friendlyBases = await ddcsControllers.baseActionRead({
            baseType: "MOB",
            side: sideStackedAgainst.underdog,
            enabled: true
        });
        await checkBasesToSpawnConvoysFrom(friendlyBases, aIConfig);
    }
}

export async function checkBasesToSpawnConvoysFrom(
    friendlyBases: typings.IBase[],
    aIConfig: typings.IAIConfig
): Promise<void> {
    for (const base of friendlyBases) {
		// @ts-ignore
        for (const [key, baseTemplate] of Object.entries(base.polygonLoc.convoyTemplate)) {
            if (aIConfig.AIType === "groundConvoy" && baseTemplate.route.length > 1) {
                const destBaseInfo = await ddcsControllers.baseActionRead({
                    _id: baseTemplate.destBase,
                    side: ddcsControllers.enemyCountry[base.side],
                    enabled: true
                });
                if (destBaseInfo.length > 0) {
                    const curBase = destBaseInfo[0];
                    const baseConvoyGroupName = "AI|" + aIConfig.name +
                        "|" + baseTemplate.sourceBase +
                        "_" + baseTemplate.destBase + "|";
						console.log("CG1: ", baseConvoyGroupName);
                    const convoyGroup = await ddcsControllers.unitActionRead({
                        groupName: baseConvoyGroupName,
                        isCrate: false,
                        dead: false
                    });
					// console.log("CG2: ", convoyGroup, baseConvoyGroupName);
                    if (convoyGroup.length === 0) {
                        console.log("convoy ", base.name, " attacking ", curBase.name);
                        const message = "C: A convoy just left " + base.name + " is attacking " + curBase.name;

                        const curNextUniqueId = getNextUniqueId();
                        setRequestJobArray({
                            reqId: curNextUniqueId,
                            callBack: "spawnConvoy",
                            reqArgs: {
                                baseConvoyGroupName,
                                side: base.side,
                                aIConfig,
                                message
                            }
                        }, curNextUniqueId);
                        await ddcsControllers.sendUDPPacket("frontEnd", {
                            actionObj: {
                                action: "getGroundRoute",
                                type: "roads",
                                lat1: base.centerLoc[1],
                                lon1: base.centerLoc[0],
                                lat2: curBase.centerLoc[1],
                                lon2: curBase.centerLoc[0],
                                reqID: curNextUniqueId,
                                time: new Date()
                            }
                        });
                        /*
                        await ddcsControllers.spawnConvoy(
                            baseConvoyGroupName,
                            base.side,
                            baseTemplate,
                            aIConfig,
                            message
                        );

                        await ddcsControllers.spawnConvoy(
                            baseConvoyGroupName,
                            2,
                            incomingObj.returnObj,
                            {
                                name: "convoyLarge",
                                AIType: "groundConvoy",
                                functionCall: "fullCampaignStackStats",
                                stackTrigger: "1.25",
                                makeup: [
                                    {
                                        template: "tank",
                                        count: 2
                                    },
                                    {
                                        template: "mobileAntiAir",
                                        count: 2
                                    },
                                    {
                                        template: "samIR",
                                        count: 2
                                    }
                                ]
                            },
                            "Test Spawn Convoy"
                        );
                         */
                    }
                }
            }
            if (aIConfig.AIType === "CAPDefense") {
                const destBaseInfo = await ddcsControllers.baseActionRead({
                    _id: baseTemplate.destBase,
                    side: ddcsControllers.enemyCountry[base.side],
                    enabled: true
                });
                if (destBaseInfo.length > 0) {
                    // check if convoy exists first
                    const baseCapGroupName = "AI|" + aIConfig.name + "|" + base.name + "|";
                    const capGroup = await ddcsControllers.unitActionRead({
                        groupName: baseCapGroupName,
                        isCrate: false,
                        dead: false
                    });
                    console.log("RESPAWNCAP: ", baseCapGroupName, capGroup.length);
                    // respawn convoy because it doesnt exist
                    await ddcsControllers.spawnCAPDefense(
                        baseCapGroupName,
                        base.side,
                        base,
                        aIConfig,
                        "C: A CAP Defense spawned at " + base.name
                    );
                }
            }
        }
    }
}
