/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function maintainPvEConfig(): Promise<void> {
    const stackObj: {fullCampaignStackStats: ddcsController.IPlayerBalance} = await campaignStackTypes();
    let lockedStack: boolean;
    for (const pveConfig of ddcsController.config.pveAIConfig) {
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

export async function campaignStackTypes(): Promise<{fullCampaignStackStats: ddcsController.IPlayerBalance}> {
    const sideStackedAgainst = await ddcsController.checkCurrentPlayerBalance();
    return { fullCampaignStackStats: sideStackedAgainst };
}

export async function processAI(sideStackedAgainst: {underdog: number}, aIConfig: ddcsController.IAIConfig): Promise<void> {
    console.log("sideStackedAgainst: ", sideStackedAgainst);
    if (sideStackedAgainst.underdog > 0) {
        const friendlyBases = await ddcsController.baseActionRead({
            baseType: "MOB",
            side: sideStackedAgainst.underdog,
            enabled: true
        });
        await checkBasesToSpawnConvoysFrom(friendlyBases, aIConfig);
    }
}

export async function checkBasesToSpawnConvoysFrom(
    friendlyBases: ddcsController.IBase[],
    aIConfig: ddcsController.IAIConfig
): Promise<void> {
    for (const base of friendlyBases) {
        // @ts-ignore
        for (const baseTemplate of base.polygonLoc.convoyTemplate) {
            if (aIConfig.AIType === "groundConvoy" && baseTemplate.route.length > 1) {
                const destBaseInfo = await ddcsController.baseActionRead({
                    _id: baseTemplate.destBase,
                    side: ddcsController.enemyCountry[base.side],
                    enabled: true
                });
                if (destBaseInfo.length > 0) {
                    const curBase = destBaseInfo[0];
                    const baseConvoyGroupName = "AI|" + aIConfig.name +
                        "|" + baseTemplate.sourceBase +
                        "_" + baseTemplate.destBase + "|";
                    const convoyGroup = await ddcsController.unitActionRead({
                        groupName: baseConvoyGroupName,
                        isCrate: false,
                        dead: false
                    });
                    if (convoyGroup.length === 0) {
                        console.log("convoy ", base.name, " attacking ", curBase.name);
                        const message = "C: A convoy just left " + base.name + " is attacking " + curBase.name;
                        await ddcsController.spawnConvoy(
                            baseConvoyGroupName,
                            base.side,
                            baseTemplate,
                            aIConfig,
                            message
                        );
                    }
                }
            }
            if (aIConfig.AIType === "CAPDefense") {
                const destBaseInfo = await ddcsController.baseActionRead({
                    _id: baseTemplate.destBase,
                    side: ddcsController.enemyCountry[base.side],
                    enabled: true
                });
                if (destBaseInfo.length > 0) {
                    // check if convoy exists first
                    const baseCapGroupName = "AI|" + aIConfig.name + "|" + base.name + "|";
                    const capGroup = await ddcsController.unitActionRead({
                        groupName: baseCapGroupName,
                        isCrate: false,
                        dead: false
                    });
                    console.log("RESPAWNCAP: ", baseCapGroupName, capGroup.length);
                    // respawn convoy because it doesnt exist
                    await ddcsController.spawnCAPDefense(
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
