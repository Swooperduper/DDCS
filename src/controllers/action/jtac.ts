/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

const jtacDistance = 5;
let curLaserCode = 1688;
const redLaserCode = 1686;
const blueLaserCode = 1687;
const fiveMins = 5 * 60 * 1000;

export async function aliveJtac30SecCheck(): Promise<void> {
    const jtacUnits = await ddcsController.unitActionRead({
        proxChkGrp: "jtac",
        dead: false
    });
    for (const jtUnit of jtacUnits) {
        if (jtUnit.jtacTarget) {
            const jtacTarget = await ddcsController.unitActionRead({
                name: jtUnit.jtacTarget
            });
            const curJtacTarget = jtacTarget[0];
            if (curJtacTarget) {
                if (!curJtacTarget.dead) {
                    if (jtUnit.jtacReplenTime < new Date().getTime()) {
                        await setLaserSmoke(jtUnit, curJtacTarget);
                    }
                } else {
                    await ddcsController.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                    await removeLaserIR(jtUnit);
                    await jtacNewTarget(jtUnit);
                }
            } else {
                await ddcsController.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                await exports.removeLaserIR(jtUnit);
                await exports.jtacNewTarget(jtUnit);
            }
        } else {
            await jtacNewTarget(jtUnit);
        }
    }
}

export async function jtacNewTarget(jtUnit: ddcsController.IUnit): Promise<void> {
    const enemySide = (jtUnit.coalition === 1) ? 2 : 1;
    const enemyUnits = await ddcsController.getCoalitionGroundUnitsInProximity(jtUnit.lonLatLoc, jtacDistance, enemySide);
    const enemyUnitNameArray = _.map(enemyUnits, "name");
    if (enemyUnitNameArray.length > 0) {
        await ddcsController.cmdQueActionsSave({
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
        const fJtacUnit = await ddcsController.unitActionRead({name: losReply.jtacUnitName});
        const curJtacUnit = fJtacUnit[0];
        const eJtacUnit = await ddcsController.unitActionRead({name: {$in: losReply.data}});
        _.forEach(eJtacUnit, (jtUnit) => {
            const curUnitDict = _.find(ddcsController.unitDictionary, {_id: jtUnit.type});
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

export async function removeLaserIR(jtUnit: ddcsController.IUnit): Promise<void> {
    console.log("Removing Laser: ", jtUnit.name);
    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action : "REMOVELASERIR",
            jtacUnitName: jtUnit.name
        },
        queName: "clientArray"
    });
}

export async function setLaserSmoke(jtUnit: ddcsController.IUnit, enemyUnit: ddcsController.IUnit): Promise<void> {
    console.log("Setting Laser: ", jtUnit.name);
    if (jtUnit.coalition === 1) {
        curLaserCode = redLaserCode;
    } else {
        curLaserCode = blueLaserCode;
    }

    await ddcsController.cmdQueActionsSave({
        actionObj: {
            action: "SETLASERSMOKE",
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition
        },
        queName: "clientArray"
    });
    await ddcsController.unitActionUpdate({_id: jtUnit.name, jtacTarget: enemyUnit.name, jtacReplenTime: new Date().getTime() + fiveMins});
}
