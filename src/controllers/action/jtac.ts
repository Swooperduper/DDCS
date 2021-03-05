/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {getNextUniqueId, setRequestJobArray} from "../";
const requestJobArray: any[] = [];

const jtacDistance = 5;
let curLaserCode = 1688;
const redLaserCode = 1686;
const blueLaserCode = 1687;
const fiveMins = 5 * 60 * 1000;

/*
export async function syncByName(incomingObj: any, curReqJobIndex: number): Promise<void> {
    const curReqJob = requestJobArray[curReqJobIndex];
    console.log("server: ", curReqJob.reqArgs.serverCount, "db: ", curReqJob.reqArgs.dbCount);

    const aliveNamesObj =
        await ddcsControllers.actionAliveNames({dead: false});
    const aliveNameArray = aliveNamesObj.map((u: any) => u._id);

    if (curReqJob.reqArgs.serverCount > curReqJob.reqArgs.dbCount) {
        const missingNames = _.difference(incomingObj.returnObj, aliveNameArray);
        console.log("Db is missing ", missingNames, " unit(s)");
        if (missingNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncInfo",
                    objType: (ddcsControllers.UNIT_CATEGORY[incomingObj.unitCategory] === "STRUCTURE") ? "static" : "unit",
                    missingNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }

    if (curReqJob.reqArgs.serverCount < curReqJob.reqArgs.dbCount) {
        console.log("server: ", curReqJob.reqArgs.serverCount, "db: ", curReqJob.reqArgs.dbCount);
        console.log("Server Has Active Objs");
        const missingNames = _.difference(aliveNameArray, incomingObj.returnObj);
        console.log("Server is missing ", missingNames, " obj(s)");
        if (missingNames.length > 0) {
            await ddcsControllers.sendUDPPacket("frontEnd", {
                actionObj: {
                    action: "reSyncInfo",
                    objType: (ddcsControllers.UNIT_CATEGORY[incomingObj.unitCategory] === "STRUCTURE") ? "static" : "unit",
                    missingNames,
                    reqID: 0, // dont run anything with return data
                    time: new Date()
                }
            });
        }
    }
    requestJobArray.splice(curReqJobIndex, 1);
}
 */

export async function processJtacLos(incomingObj: any): Promise<void> {


    //  await ddcsControllers.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
    // await exports.removeLaserIR(jtUnit);
    // await exports.jtacNewTarget(jtUnit);

    await processLOSEnemy(incomingObj.jtacUnit, incomingObj.returnObj);
    // await removeLaserIR(jtUnit);
    // await jtacNewTarget(jtUnit);
    console.log("IC: ", incomingObj);
}

export async function lookupJtacLOS(jtacUnit: typings.IUnit) {
    // const enemySide = (jtacUnit.coalition === 1) ? 2 : 1;
    const enemySide = (jtacUnit.coalition === 1) ? 1 : 2;
    const enemyUnits = await ddcsControllers.getCoalitionGroundUnitsInProximity(jtacUnit.lonLatLoc, jtacDistance, enemySide);
    const enemyUnitNameArray = _.map(enemyUnits, "name");
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
        await lookupJtacLOS(jtUnit);
        /*
        if (jtUnit.jtacTarget) {
            const jtacTarget = await ddcsControllers.unitActionRead({
                name: jtUnit.jtacTarget
            });

            const curJtacTarget = jtacTarget[0];
            if (curJtacTarget) {
                if (!curJtacTarget.dead) {
                    if (jtUnit.jtacReplenTime < new Date().getTime()) {
                        await setLaserSmoke(jtUnit, curJtacTarget);
                    }
                } else {
                    await ddcsControllers.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                    await removeLaserIR(jtUnit);
                    await jtacNewTarget(jtUnit);
                }
            } else {
                await ddcsControllers.unitActionUpdateByName({name: jtUnit.name, jtacTarget: null});
                await exports.removeLaserIR(jtUnit);
                await exports.jtacNewTarget(jtUnit);
            }
        } else {
            await jtacNewTarget(jtUnit);
        }
        */
    }
}

export async function jtacNewTarget(jtUnit: typings.IUnit): Promise<void> {
    const enemySide = (jtUnit.coalition === 1) ? 2 : 1;
    const enemyUnits = await ddcsControllers.getCoalitionGroundUnitsInProximity(jtUnit.lonLatLoc, jtacDistance, enemySide);
    const enemyUnitNameArray = _.map(enemyUnits, "name");
    if (enemyUnitNameArray.length > 0) {
        ddcsControllers.sendUDPPacket("frontEnd", {
            actionObj: {
                action: "ISLOSVISIBLE",
                jtacUnitName: jtUnit.name,
                enemyUnitNames: enemyUnitNameArray
            },
            queName: "clientArray"
        });
    }
}

export async function processLOSEnemy(jtacUnitName: string, data: string[]): Promise<void> {

    const engineCache = ddcsControllers.getEngineCache();
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
        console.log("SMOKE: ", enemyUnit);
        // await setLaserSmoke(curJtacUnit, enemyUnit);
    }
}

export async function removeLaserIR(jtUnit: typings.IUnit): Promise<void> {
    console.log("Removing Laser: ", jtUnit.name);
    ddcsControllers.sendUDPPacket("frontEnd", {
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

    ddcsControllers.sendUDPPacket("frontEnd", {
        actionObj: {
            action: "SETLASERSMOKE",
            jtacUnitName: jtUnit.name,
            enemyUnitName: enemyUnit.name,
            laserCode: curLaserCode,
            coalition: jtUnit.coalition
        },
        queName: "clientArray"
    });
    await ddcsControllers.unitActionUpdate({_id: jtUnit.name, jtacTarget: enemyUnit.name, jtacReplenTime: new Date().getTime() + fiveMins});
}
