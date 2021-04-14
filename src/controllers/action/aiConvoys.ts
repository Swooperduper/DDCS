/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {getNextUniqueId, setRequestJobArray} from "../";

export async function maintainPvEConfig(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const stackObj = await campaignStackTypes();
    console.log("stackobj: ", stackObj);
    let didAISpawn: boolean = false;
    for (const pveConfig of engineCache.config.pveAIConfig) {
        for (const aIConfig of pveConfig.config) {
            if (aIConfig.functionCall === "fullAIEnabled") {
                didAISpawn = (!didAISpawn) ? await processAI({underdog: 1}, aIConfig, true) : false;
                didAISpawn = (!didAISpawn) ? await processAI({underdog: 2}, aIConfig, true) : false;
            } else {
                // @ts-ignore
                const sideStackedAgainst = stackObj[aIConfig.functionCall];
                if (sideStackedAgainst.ratio >= aIConfig.stackTrigger) {
                    didAISpawn = (!didAISpawn) ?  await processAI(sideStackedAgainst, aIConfig, false) : false;
                } else {
                    didAISpawn = (!didAISpawn) ? await processAI({underdog: 1}, aIConfig, true) : false;
                    didAISpawn = (!didAISpawn) ? await processAI({underdog: 2}, aIConfig, true) : false;
                }
            }
        }
    }
}

export async function campaignStackTypes(): Promise<{}> {
    const fullCampaign = await ddcsControllers.checkCurrentPlayerBalance();
    const instant = await ddcsControllers.checkRealtimeSideBalance();
    return {
        fullCampaign,
        instant
    };
}

export async function processAI(sideStackedAgainst: {underdog: number}, aIConfig: typings.IAIConfig, spawnHalf: boolean): Promise<boolean> {
    console.log("sideStackedAgainst: ", sideStackedAgainst);
    if (sideStackedAgainst.underdog > 0) {
        const friendlyBases = await ddcsControllers.baseActionRead({
            baseType: "MOB",
            side: sideStackedAgainst.underdog,
            enabled: true
        });
        return await checkBasesToSpawnConvoysFrom(friendlyBases, aIConfig, spawnHalf);
    }
    return false;
}

export async function checkBasesToSpawnConvoysFrom(
    friendlyBases: typings.IBase[],
    aIConfig: typings.IAIConfig,
    spawnHalf: boolean
): Promise<boolean> {
    for (const base of friendlyBases) {
        const shelterAlive = await ddcsControllers.unitActionRead({
            _id:  base.name + " Shelter",
            dead: false,
            coalition: base.side
        });

        if (shelterAlive.length > 0 || !aIConfig.isShelterRequired) {
            // @ts-ignore
            for (const [key, baseTemplate] of Object.entries(base.polygonLoc.convoyTemplate)) {
                if (aIConfig.AIType === "groundConvoy") {
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
                        const convoyGroup = await ddcsControllers.unitActionRead({
                            groupName: baseConvoyGroupName,
                            isCrate: false,
                            dead: false
                        });
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
                                    spawnHalf,
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
                            return true;
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
        } else {
            console.log(base.name + " Shelter does not exist, dont spawn convoys");
        }
    }
    return false;
}
