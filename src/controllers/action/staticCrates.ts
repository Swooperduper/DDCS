/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function destroyCrates(
    grpTypes: {[key: string]: ddcsController.ICrate[]},
    curCrateType: string,
    numCrate: number
): Promise<void> {
    let cCnt = 1;
    for (const eCrate of grpTypes[curCrateType]) {
        if ( cCnt <= numCrate) {
            console.log("delCrate: ",  eCrate._id);
            await ddcsController.staticCrateActionDelete({_id: eCrate._id})
                .catch((err) => {
                    console.log("erroring line23: ", err);
                })
            ;
            await ddcsController.destroyUnit(eCrate.name);
            cCnt ++;
        }
    }
}

export async function processStaticCrate(crateObj: ddcsController.ISrvCratesPayload): Promise<void> {
    for (const dataObj of crateObj.data) {
        if (dataObj.alive) {
            await ddcsController.staticCrateActionUpdate({_id: name, lonLatLoc: [dataObj.lon, dataObj.lat]});
        } else {
            await ddcsController.staticCrateActionDelete({_id: name});
        }
        if (crateObj.callback === "unpackCrate") {
            await unpackStaticCrate(crateObj);
        }
    }
}

export async function unpackStaticCrate(crateObj: ddcsController.ISrvCratesPayload): Promise<void> {
    const pUnit = await ddcsController.unitActionRead({unitId: crateObj.unitId});
    const curPlayerUnit = pUnit[0];
    const crates = await ddcsController.getStaticCratesInProximity(curPlayerUnit.lonLatLoc, 0.2, curPlayerUnit.coalition);
    let localCrateNum: number;
    let msg: string;
    const curCrate: ddcsController.ICrate = crates[0];
    const numCrate: number = curCrate.crateAmt;
    const curCrateSpecial: string = curCrate.special || "";
    const curCrateType: string = curCrate.templateName;
    const isCombo: boolean = curCrate.isCombo;
    const isMobile: boolean = curCrate.playerCanDrive;

    if (curCrate) {
        const grpTypes: any = _.transform(crates, (result: any, value: any) => {
            (result[value.templateName] || (result[value.templateName] = [])).push(value);
        }, {});

        localCrateNum = grpTypes[curCrateType].length;

        if ( localCrateNum >=  numCrate) {
            if (curCrateSpecial === "reloadGroup") {
                const response = await ddcsController.reloadSAM(curPlayerUnit);
                if (response) {
                    await destroyCrates(grpTypes, curCrateType, numCrate);
                }
            } else if (_.includes(curCrateSpecial, "CCBuild|")) {
                console.log("trying to build cc on empty base");
                const response = await ddcsController.spawnCCAtNeutralBase(curPlayerUnit);
                console.log("spawn response1: ", response);
                if (response) {
                    await destroyCrates(grpTypes, curCrateType, numCrate);
                }
            } else {
                msg = "G: Unpacking " + _.toUpper(curCrateSpecial) + " " + curCrateType + "!";
                await ddcsController.unpackCrate(
                    curPlayerUnit,
                    curCrate.country,
                    curCrateType,
                    curCrateSpecial,
                    isCombo,
                    isMobile
                )
                    .then((response: any) => {
                        console.log("unpacking response2: ", response);
                        if (response) {
                            exports.destroyCrates(grpTypes, curCrateType, numCrate);
                        }
                    })
                    .catch((err: any) => {
                        console.log("line 32: ", err);
                    })
                ;
                // console.log('singleCrateDestroy: ', curCrate.name);
                // groupController.destroyUnit(serverName, curCrate.name);
                await ddcsController.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    msg,
                    5
                );
            }

        } else {
            if (localCrateNum) {
                await ddcsController.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    "G: Not Enough Crates for " + curCrateType + "!(" + localCrateNum + "/" + numCrate + ")",
                    5
                );
            } else {
                await ddcsController.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    "G: No Crates In Area!",
                    5
                );
            }
        }
    } else {
        // no troops
        await ddcsController.sendMesgToGroup(
            curPlayerUnit.groupId,
            "G: No Crates To Unpack!",
            5
        );
    }
}
