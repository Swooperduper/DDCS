/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {getNextUniqueId, setRequestJobArray} from "../";

const jtacDistance = 5;
let curLaserCode = 1688;
const redLaserCode = 1686;
const blueLaserCode = 1687;
const fiveMins = 5 * 60 * 1000;

export async function baseDefenseDetectSmoke() {
    const mainBaseMOBs = await ddcsControllers.baseActionRead({baseType: "MOB", _id: { $not: /~/ }, enabled: true});
    for (const base of mainBaseMOBs) {
        const enemyUnits = await ddcsControllers.getCoalitionGroundUnitsInProximity(
            base.centerLoc,
            jtacDistance,
            ddcsControllers.enemyCountry[base.side]
        );
        console.log("Enemy Near MOB: ", enemyUnits);
        if (enemyUnits.length > 0) {
            for (const unit of enemyUnits) {
                await ddcsControllers.sendUDPPacket("frontEnd", {
                    actionObj: {
                        action: "setSmoke",
                        enemyUnitName: unit._id,
                        coalition: base.side,
                        reqID: 0
                    }
                });
            }
        }
    }
}

export async function processJtacLos(incomingObj: any): Promise<void> {
    await processLOSEnemy(incomingObj.jtacUnit, incomingObj.returnObj);
}

export async function lookupJtacLOS(jtacUnit: typings.IUnit) {
    const enemySide = (jtacUnit.coalition === 1) ? 2 : 1;
    // const enemySide = (jtacUnit.coalition === 1) ? 1 : 2; marking friendlys
    const enemyUnits = await ddcsControllers.getCoalitionGroundUnitsInProximity(jtacUnit.lonLatLoc, jtacDistance, enemySide);
    const enemyUnitNameArray = _.map(enemyUnits, "name");
    // console.log("CHECK123: ", jtacUnit.name, enemyUnits);
    if (enemyUnitNameArray.length > 0) {
        const curNextUniqueId = getNextUniqueId();
        setRequestJobArray({
            reqId: curNextUniqueId,
            callBack: "processJtacLos",
            reqArgs: {
                jtacName: jtacUnit.name,
                enemyUnits: enemyUnitNameArray
            }
        }, curNextUniqueId);
        await ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "processLOS",
                jtacUnitName: jtacUnit.name,
                enemyUnitNames: enemyUnitNameArray,
                reqID: curNextUniqueId,
                time: new Date()
            }
        });
    }
}

export async function aliveJtac30SecCheck(): Promise<void> {
    const jtacUnits = await ddcsControllers.unitActionRead({
        proxChkGrp: "jtac",
        dead: false
    });
    for (const jtUnit of jtacUnits) {
        if (!jtUnit.jtacReplenTime || jtUnit.jtacReplenTime < new Date().getTime()) {
            await lookupJtacLOS(jtUnit);
        }
    }
}

export async function processLOSEnemy(jtacUnitName: string, data: string[]): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    // console.log("Seen Units: ", data);
    if (data.length) {
        let enemyUnit;
        const unitPThrArray: any[] = [];
        const fJtacUnit = await ddcsControllers.unitActionRead({name: jtacUnitName});
        const curJtacUnit = fJtacUnit[0];
        const eJtacUnit = await ddcsControllers.unitActionRead({name: {$in: data}});
        _.forEach(eJtacUnit, (jtUnit) => {
            const curUnitDict = _.find(engineCache.unitDictionary, {_id: jtUnit.type});
            if (curUnitDict) {
                jtUnit.threatLvl = curUnitDict.threatLvl;
                unitPThrArray.push(jtUnit);
            } else {
                console.log("cant findUnit: ", curUnitDict, jtUnit.type);
            }
        });
        enemyUnit = _.orderBy(unitPThrArray, "threatLvl", "desc")[0];
        // console.log("SMOKE: ", enemyUnit);
        if (enemyUnit.name) {
            await setLaserSmoke(curJtacUnit, enemyUnit);
        } else {
            await removeLaserIR(curJtacUnit);
        }
    }
}

export async function removeLaserIR(jtUnit: typings.IUnit): Promise<void> {
    console.log("Removing Laser: ", jtUnit.name);
    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action : "removeLaserIR",
            jtacUnitName: jtUnit.name
        }
    });
}

export async function processJtacTargetInfo(incomingObj: any) {
    // console.log("jtacReply: ", incomingObj);
    await ddcsControllers.unitActionUpdate({_id: incomingObj.jtacUnit, jtacEnemyLocation: incomingObj.returnObj,
        jtacReplenTime: new Date().getTime() + fiveMins});
}

export async function setLaserSmoke(jtUnit: typings.IUnit, enemyUnit: typings.IUnit): Promise<void> {
    // console.log("Setting LaserSmoke: ", jtUnit.name, enemyUnit.name);
    if (jtUnit.coalition === 1) {
        curLaserCode = redLaserCode;
    } else {
        curLaserCode = blueLaserCode;
    }

    const curNextUniqueId = getNextUniqueId();
    setRequestJobArray({
        reqId: curNextUniqueId,
        callBack: "processJtacTargetInfo",
        reqArgs: {
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition
        }
    }, curNextUniqueId);

    await ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "setLaserSmoke",
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition,
            reqID: curNextUniqueId
        }
    });
}
