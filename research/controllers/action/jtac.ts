/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../";
import * as localDb from "../db/local";
import * as typings from "../../typings";
import * as proxZone from "../proxZone";

const jtacDistance = 5;
let curLaserCode = 1688;
const redLaserCode = 1686;
const blueLaserCode = 1687;
const fiveMins = 5 * 60 * 1000;

export async function aliveJtac30SecCheck(): Promise<void> {
    const jtacUnits = await localDb.unitActionRead({
        proxChkGrp: "jtac",
        dead: false
    });
    for (const jtUnit of jtacUnits) {
        if (jtUnit.jtacTarget) {
            const jtacTarget = await localDb.unitActionRead({
                name: jtUnit.jtacTarget
            });
            const curJtacTarget = jtacTarget[0];
            if (curJtacTarget) {
                if (!curJtacTarget.dead) {
                    if (jtUnit.jtacReplenTime < new Date().getTime()) {
                        await setLaserSmoke(jtUnit, curJtacTarget);
                    }
                } else {
                    await localDb.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                    await removeLaserIR(jtUnit);
                    await jtacNewTarget(jtUnit);
                }
            } else {
                await localDb.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                await exports.removeLaserIR(jtUnit);
                await exports.jtacNewTarget(jtUnit);
            }
        } else {
            await jtacNewTarget(jtUnit);
        }
    }
}

export async function jtacNewTarget(jtUnit: typings.IUnit): Promise<void> {
    const enemySide = (jtUnit.coalition === 1) ? 2 : 1;
    const enemyUnits = await proxZone.getCoalitionGroundUnitsInProximity(jtUnit.lonLatLoc, jtacDistance, enemySide);
    const enemyUnitNameArray = _.map(enemyUnits, "name");
    if (enemyUnitNameArray.length > 0) {
        await localDb.cmdQueActionsSave({
            actionObj: {
                action: "ISLOSVISIBLE",
                jtacUnitName: jtUnit.name,
                enemyUnitNames: enemyUnitNameArray
            },
            queName: "clientArray"
        });
    }
}

export async function processLOSEnemy(losReply: {jtacUnitName: string, data: string[]}): Promise<void> {
    if (losReply.data.length) {
        let enemyUnit;
        const unitPThrArray: any[] = [];
        const fJtacUnit = await localDb.unitActionRead({name: losReply.jtacUnitName});
        const curJtacUnit = fJtacUnit[0];
        const eJtacUnit = await localDb.unitActionRead({name: {$in: losReply.data}});
        _.forEach(eJtacUnit, (jtUnit) => {
            const curUnitDict = _.find(constants.unitDictionary, {_id: jtUnit.type});
            if (curUnitDict) {
                jtUnit.threatLvl = curUnitDict.threatLvl;
                unitPThrArray.push(jtUnit);
            } else {
                console.log("cant findUnit: ", curUnitDict, jtUnit.type);
            }
        });
        enemyUnit = _.orderBy(unitPThrArray, "threatLvl", "desc")[0];
        await setLaserSmoke(curJtacUnit, enemyUnit);
    }
}

export async function removeLaserIR(jtUnit: typings.IUnit): Promise<void> {
    console.log("Removing Laser: ", jtUnit.name);
    await localDb.cmdQueActionsSave({
        actionObj: {
            action : "REMOVELASERIR",
            jtacUnitName: jtUnit.name
        },
        queName: "clientArray"
    });
}

export async function setLaserSmoke(jtUnit: typings.IUnit, enemyUnit: typings.IUnit): Promise<void> {
    console.log("Setting Laser: ", jtUnit.name);
    if (jtUnit.coalition === 1) {
        curLaserCode = redLaserCode;
    } else {
        curLaserCode = blueLaserCode;
    }

    await localDb.cmdQueActionsSave({
        actionObj: {
            action: "SETLASERSMOKE",
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition
        },
        queName: "clientArray"
    });
    await localDb.unitActionUpdate({_id: jtUnit.name, jtacTarget: enemyUnit.name, jtacReplenTime: new Date().getTime() + fiveMins});
}
