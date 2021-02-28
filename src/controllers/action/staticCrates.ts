/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";

export async function destroyCrates(
    grpTypes: {[key: string]: typings.ICrate[]},
    curCrateType: string,
    numCrate: number
): Promise<void> {
    let cCnt = 1;
    for (const eCrate of grpTypes[curCrateType]) {
        if ( cCnt <= numCrate) {
            console.log("delCrate: ",  eCrate._id);
            await ddcsControllers.staticCrateActionDelete({_id: eCrate._id})
                .catch((err) => {
                    console.log("erroring line23: ", err);
                })
            ;
            await ddcsControllers.destroyUnit(eCrate.name, "static");
            cCnt ++;
        }
    }
}

export async function unpackStaticCrate(curPlayerUnit: any): Promise<void> {
    const crates = await ddcsControllers.getStaticCratesInProximity(curPlayerUnit.lonLatLoc, 0.2, curPlayerUnit.coalition);
    let localCrateNum: number;
    let msg: string;
    if (crates.length > 0) {
        const curCrate: any = crates[0];
        // const crateInfo = _.find(ddcsControllers.getEngineCache().unitDictionary, {_id: curCrate.type.split("|")[2]});

        const numCrate: number = curCrate.crateAmt;
        const curCrateSpecial: string = curCrate.special || "";
        const curCrateType: string = curCrate.templateName;
        const isCombo: boolean = curCrate.isCombo;
        const isMobile: boolean = curCrate.playerCanDrive;
        const grpTypes: any = _.transform(crates, (result: any, value: any) => {
            (result[value.templateName] || (result[value.templateName] = [])).push(value);
        }, {});

        localCrateNum = grpTypes[curCrateType].length;

        if ( localCrateNum >=  numCrate) {
            if (curCrateSpecial === "reloadGroup") {
                const response = await ddcsControllers.reloadSAM(curPlayerUnit);
                if (response) {
                    await destroyCrates(grpTypes, curCrateType, numCrate);
                }
            } else if (_.includes(curCrateSpecial, "CCBuild|")) {
                console.log("trying to build cc on empty base");
                const response = await ddcsControllers.spawnCCAtNeutralBase(curPlayerUnit);
                console.log("spawn response1: ", response);
                if (response) {
                    await destroyCrates(grpTypes, curCrateType, numCrate);
                }
            } else {
                msg = "G: Unpacking " + _.toUpper(curCrateSpecial) + " " + curCrateType + "!";
                // console.log("del crate obj: ", grpTypes, curCrateType, numCrate);
                // exports.destroyCrates(grpTypes, curCrateType, numCrate);

                await ddcsControllers.unpackCrate(
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
                            destroyCrates(grpTypes, curCrateType, numCrate);
                        }
                    })
                    .catch((err: any) => {
                        console.log("line 32: ", err);
                    })
                ;
                // console.log('singleCrateDestroy: ', curCrate.name);
                // groupController.destroyUnit(serverName, curCrate.name);
                await ddcsControllers.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    msg,
                    5
                );
            }

        } else {
            if (localCrateNum) {
                await ddcsControllers.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    "G: Not Enough Crates for " + curCrateType + "!(" + localCrateNum + "/" + numCrate + ")",
                    5
                );
            } else {
                await ddcsControllers.sendMesgToGroup(
                    curPlayerUnit.groupId,
                    "G: No Crates In Area!",
                    5
                );
            }
        }
    } else {
        // no troops
        await ddcsControllers.sendMesgToGroup(
            curPlayerUnit.groupId,
            "G: No Crates To Unpack!",
            5
        );
    }
}
