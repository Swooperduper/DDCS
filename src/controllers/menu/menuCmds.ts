/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typing from "../../typings";
import * as ddcsControllers from "../";

export async function internalCargo(curUnit: any, curPlayer: any, intCargoType: string) {
    const engineCache = ddcsControllers.getEngineCache();
    let crateObj: any;
    let crateCount: number = 0;
    let curBaseName: string;
    let curBaseObj: any;
    if (intCargoType === "loaded") {
        if (curUnit.intCargoType) {
            await ddcsControllers.sendMesgToGroup(
                curUnit.groupId,
                "G: " + curUnit.intCargoType + " Internal Crate is Onboard!",
                5
            );
        } else {
            await ddcsControllers.sendMesgToGroup(
                curUnit.groupId,
                "G: No Internal Crates Onboard!",
                5
            );
        }
    }
    if (intCargoType === "unpack") {
        const intCargo = _.split(curUnit.intCargoType, "|");
        const curIntCrateType = intCargo[1];
        const curIntCrateBaseOrigin = intCargo[2];
        const crateType = (curUnit.coalition === 1) ? "UAZ-469" : "Hummer";
        if (curUnit.inAir) {
            await ddcsControllers.sendMesgToGroup(
                curUnit.groupId,
                "G: Please Land Before Attempting Cargo Commands!",
                5
         );
        } else {
            if (curIntCrateType) {
                const playerProx: any [] = [];
                const bases = await ddcsControllers.baseActionRead({});
                for (const base of bases) {
                    const curCheckAllBase = await ddcsControllers.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername);
                    playerProx.push(curCheckAllBase);
                    if (curCheckAllBase) {
                        curBaseObj = base;
                    }
                }
                curBaseName = _.split(curBaseObj.name, " #")[0];
                console.log("intCurUnpackBaseAt: ", curBaseName);
                if (curIntCrateBaseOrigin === curBaseName) {
                    await ddcsControllers.sendMesgToGroup(
                        curUnit.groupId,
                        "G: You can't unpack this internal crate from same base it is acquired!",
                        5
                    );
                } else {
                    if (curIntCrateType === "JTAC") {
                        await unpackCrate(curUnit, curUnit.country, crateType, "jtac", false, true);
                        await ddcsControllers.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""});
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: You Have Spawned A JTAC Unit From Internal Cargo!",
                            5
                        );
                    }
                    if (curIntCrateType === "BaseRepair") {
                        if (_.some(playerProx)) {
                            await ddcsControllers.repairBase(curBaseObj, curUnit);
                        } else {
                            await ddcsControllers.sendMesgToGroup(
                                curUnit.groupId,
                                "G: You are not near any friendly bases!",
                                5
                            );
                        }
                    }
                    if (curIntCrateType === "CCBuild") {  // serverName, curUnit, curPlayer, intCargoType
                        const delCrates = await ddcsControllers.staticCrateActionRead({playerOwnerId: curPlayer.ucid});
                        for (const crate of delCrates) {
                            if (crateCount > engineCache.config.maxCrates - 2) {
                                await ddcsControllers.staticCrateActionDelete({
                                    _id: crate._id
                                });
                                await ddcsControllers.destroyUnit(crate._id, "static");
                            }
                            crateCount++;
                        }
                        crateObj = {
                            name: curUnit.intCargoType + "|#" + _.random(1000000, 9999999),
                            unitLonLatLoc: curUnit.lonLatLoc,
                            shape_name: "iso_container_small_cargo",
                            category: "Cargo",
                            type: "iso_container_small",
                            heading: curUnit.hdg,
                            canCargo: true,
                            mass: 500,
                            playerOwnerId: curPlayer.ucid,
                            templateName: "CCBuild",
                            special: curUnit.intCargoType,
                            crateAmt: 1,
                            isCombo: false,
                            playerCanDrive: false,
                            country: ddcsControllers.defCountrys[curUnit.coalition],
                            side: curUnit.coalition,
                            coalition: curUnit.coalition
                        };
                        await ddcsControllers.spawnLogiCrate(crateObj, true);
                        await ddcsControllers.unitActionUpdateByUnitId({unitId: curUnit.unitId, intCargoType: ""});
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Command Center Build crate has been spawned!",
                            5
                        );
                    }
                }
            } else {
                await ddcsControllers.sendMesgToGroup(
                    curUnit.groupId,
                    "G: No Internal Crates Onboard!",
                    5
                );
            }
        }
    }
    if (intCargoType === "loadJTAC" || intCargoType === "loadBaseRepair" || intCargoType === "loadCCBuild") {
        if (curUnit.inAir) {
            await ddcsControllers.sendMesgToGroup(
                curUnit.groupId,
                "G: Please Land Before Attempting Cargo Commands!",
                5
            );
        } else {
            const bases = await ddcsControllers.baseActionRead({});
            const playerProx: any [] = [];
            for (const base of bases) {
                const curCheckAllBase = await ddcsControllers.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername);
                playerProx.push(curCheckAllBase);
                if (curCheckAllBase) {
                    curBaseObj = base;
                }
            }
            if (_.some(playerProx)) {
                curBaseName = _.split(_.get(curBaseObj, "name"), " #")[0];
                console.log("intCurBaseAt: ", curBaseName);
                const aliveLogistics = await ddcsControllers.unitActionRead({name: curBaseName + " Logistics", dead: false});
                if (aliveLogistics.length > 0 || _.includes(curBaseName, "Carrier")) {
                    if (intCargoType === "loadJTAC") {
                        await ddcsControllers.unitActionUpdateByUnitId({
                            unitId: curUnit.unitId,
                            intCargoType: "|JTAC|" + curBaseName + "|"
                        });
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Picked Up A JTAC Internal Crate From " + curBaseName + "!",
                            5
                        );
                    }
                    if (intCargoType === "loadBaseRepair") {
                        await ddcsControllers.unitActionUpdateByUnitId({
                            unitId: curUnit.unitId,
                            intCargoType: "|BaseRepair|" + curBaseName + "|"
                        });
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Picked Up A Base Repair Internal Crate From " + curBaseName + "!",
                            5
                        );
                    }
                    if (intCargoType === "loadCCBuild") {
                        await ddcsControllers.unitActionUpdateByUnitId({
                            unitId: curUnit.unitId,
                            intCargoType: "|CCBuild|" + curBaseName + "|"
                        });
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Picked Up A Base Command Center Build Crate From " + curBaseName + "!",
                            5
                        );
                    }
                } else {
                    await ddcsControllers.sendMesgToGroup(
                        curUnit.groupId,
                        "G: " + curBaseName + " logistical supply system is cut, repair the base!",
                        5
                    );
                }
            } else {
                await ddcsControllers.sendMesgToGroup(
                    curUnit.groupId,
                    "G: You are not within 2km of a friendly base to load internal crate!",
                    5
                );
            }
        }
    }
}

export async function isCrateOnboard(unit: any, verbose: boolean) {
    if (unit.virtCrateType) {
        if (verbose) {
            await ddcsControllers.sendMesgToGroup(
                unit.groupId,
                "G: " + _.split(unit.virtCrateType, "|")[2] + " is Onboard!",
                5
            );
        }
        return true;
    }
    if (verbose) {
        await ddcsControllers.sendMesgToGroup(
            unit.groupId,
            "G: No Crates Onboard!",
            5
        );
    }
    return false;
}

export async function isTroopOnboard(unit: any, verbose: boolean) {
    console.log("isTroopHere: ", unit, verbose);
    if (!_.isEmpty(unit.troopType)) {
        if (verbose) {
            await ddcsControllers.sendMesgToGroup(
                unit.groupId,
                "G: " + unit.troopType + " is Onboard!",
                5
            );
        }
        return true;
    }
    if (verbose) {
        await ddcsControllers.sendMesgToGroup(
            unit.groupId,
            "G: No Troops Onboard!",
            5
        );
    }
    return false;
}

export async function loadTroops(unitId: string, troopType: string) {
    const units = await ddcsControllers.unitActionRead({unitId});
    const curUnit = _.get(units, 0);
    if (curUnit.inAir) {
        await ddcsControllers.sendMesgToGroup(
            curUnit.groupId,
            "G: Please Land Before Attempting Logistic Commands!",
            5
        );
    } else {
        const playerProx: any [] = [];
        const bases = await ddcsControllers.baseActionRead({baseType: "MOB", side: curUnit.coalition});
        for (const base of bases) {
            const curCheckAllBase = await ddcsControllers.isPlayerInProximity(base.centerLoc, 3.4, curUnit.playername);
            playerProx.push(curCheckAllBase);
        }
        if (_.some(playerProx)) {
            await ddcsControllers.unitActionUpdateByUnitId({unitId, troopType});
            await ddcsControllers.sendMesgToGroup(
                curUnit.groupId,
                "G: " + troopType + " Has Been Loaded!",
                5
            );
        } else {
            // secondary check for second base distance
            const secondBases = await ddcsControllers.baseActionRead({});
            const checkAllSecondBase: any[] = [];
            let curLogistic: any;
            const aliveBases = await ddcsControllers.unitActionRead({
                _id:  /Logistics/,
                dead: false,
                coalition: curUnit.coalition
            });
            for (const base of secondBases) {
                curLogistic = _.find(aliveBases, {name: base.name + " Logistics"});
                if (!!curLogistic) {
                    checkAllSecondBase.push( await ddcsControllers.isPlayerInProximity(
                        curLogistic.lonLatLoc,
                        0.2,
                        curUnit.playername
                    ));
                }
            }
            if (_.some(checkAllSecondBase)) {
                await ddcsControllers.unitActionUpdateByUnitId({unitId, troopType})
                    .then(() => {
                        ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: " + troopType + " Has Been Loaded!",
                            5
                        );
                    })
                    .catch((err) => {
                        console.log("line 13: ", err);
                    })
                ;
            } else {
                await ddcsControllers.sendMesgToGroup(
                    curUnit.groupId,
                    "G: You are too far from a friendly base to load troops!",
                    5
                );
            }
        }
    }
}

export async function menuCmdProcess(pObj: any) {
    console.log("MENU COMMAND: ", pObj);
    const engineCache = ddcsControllers.getEngineCache();
    const defCrate = "iso_container_small";

    const units = await ddcsControllers.unitActionRead({unitId: pObj.unitId});
    if (units.length > 0) {
        const curUnit = units[0];
        const player = await ddcsControllers.srvPlayerActionsRead({name: curUnit.playername});
        if (player.length > 0) {
            const curPlayer = player[0];
            let spawnArray;
            let curSpawnUnit;
            // action menu
            switch (pObj.cmd) {
                case "serverTimeLeft":
                    await ddcsControllers.timeLeft(curUnit);
                    await ddcsControllers.setSideLockFlags();
                    break;
                case "lookupAircraftCosts":
                    await ddcsControllers.lookupAircraftCosts(curPlayer.ucid);
                    break;
                case "lookupLifeResource":
                    await ddcsControllers.lookupLifeResource(curPlayer.ucid);
                    break;
                case "resourcePoints":
                    await ddcsControllers.checkResourcePoints(curPlayer);
                    break;
                case "unloadExtractTroops":
                    if (curUnit.inAir) {
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: Please Land Before Attempting Logistic Commands!",
                            5
                        );
                    } else {
                        if (exports.isTroopOnboard(curUnit)) {
                            const playerProx: any[] = [];
                            const bases = await ddcsControllers.baseActionRead({baseType: "MOB", side: curUnit.coalition});
                            for (const base of bases) {
                                playerProx.push(await ddcsControllers.isPlayerInProximity(
                                    base.centerLoc,
                                    3.4,
                                    curUnit.playername
                                ));
                            }
                            if (_.some(playerProx)) {
                                await ddcsControllers.unitActionUpdateByUnitId({
                                    unitId: pObj.unitId,
                                    troopType: null
                                });
                                await ddcsControllers.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: " + curUnit.troopType + " has been dropped off at the base!",
                                    5
                                );
                            } else {
                                const curTroops: any[] = [];
                                const delUnits = await ddcsControllers.unitActionRead({
                                    playerOwnerId: curPlayer.ucid,
                                    isTroop: true,
                                    dead: false
                                });
                                for (const unit of delUnits) {
                                    await ddcsControllers.unitActionUpdateByUnitId({
                                        unitId: unit.unitId,
                                        dead: true
                                    });
                                    await ddcsControllers.destroyUnit(unit.name, "unit");
                                }

                                curSpawnUnit = _.cloneDeep(await ddcsControllers.getRndFromSpawnCat(
                                    curUnit.troopType,
                                    curUnit.coalition,
                                    false,
                                    true
                                )[0]);
                                spawnArray = {
                                    spwnName: "TU|" + curPlayer.ucid + "|" + curUnit.troopType + "|" +
                                        curUnit.playername + "|" + _.random(1000000, 9999999),
                                    type: curSpawnUnit.type,
                                    lonLatLoc: curUnit.lonLatLoc,
                                    heading: curUnit.hdg,
                                    country: curUnit.country,
                                    category: curSpawnUnit.unitCategory,
                                    playerCanDrive: true,
                                    coalition: curUnit.coalition
                                };

                                for (
                                    let x = 0;
                                    x < curSpawnUnit.config[engineCache.config.timePeriod].spawnCount;
                                    x++
                                ) {
                                    curTroops.push(spawnArray);
                                }
                                await ddcsControllers.unitActionUpdateByUnitId({
                                    unitId: pObj.unitId,
                                    troopType: null
                                })
                                    .catch((err) => {
                                        console.log("erroring line73: ", err);
                                    })
                                ;
                                await ddcsControllers.spawnUnitGroup(curTroops, false);
                                await ddcsControllers.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: " + curSpawnUnit.type + " has been deployed!",
                                    5
                                );
                            }
                        } else {
                            const troopUnits = await ddcsControllers.getTroopsInProximity(curUnit.lonLatLoc, 0.2, curUnit.coalition);
                            const curTroop = troopUnits[0];
                            if (curTroop) {
                                // pickup troop
                                const grpUnits = await ddcsControllers.unitActionRead({
                                    groupName: curTroop.groupName,
                                    isCrate: false,
                                    dead: false
                                });
                                for (const curTroopUnit of grpUnits) {
                                    await ddcsControllers.destroyUnit(curTroopUnit.name, "unit");
                                }
                                await ddcsControllers.unitActionUpdateByUnitId({
                                    unitId: pObj.unitId,
                                    troopType: curTroop.spawnCat
                                })
                                    .catch((err) => {
                                        console.log("erroring line57: ", err);
                                    });
                                await ddcsControllers.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: Picked Up " + curTroop.type + "!",
                                    5
                                );
                            } else {
                                // no troops
                                await ddcsControllers.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: No Troops To Extract Or Unload!",
                                    5
                                );
                            }
                        }
                    }
                    break;
                case "isTroopOnboard":
                    await isTroopOnboard(curUnit, true);
                    break;
                case "isCrateOnboard":
                    await isCrateOnboard(curUnit, true);
                    break;
                case "unpackCrate":
                    const logiProx = await ddcsControllers.getLogiTowersProximity(curUnit.lonLatLoc, 0.8, curUnit.coalition);
                    if (logiProx.length) {
                        await ddcsControllers.sendMesgToGroup(
                            curUnit.groupId,
                            "G: You need to move farther away from Command Towers (800m)",
                            5
                        );
                    } else {
                        if (curUnit.inAir) {
                            await ddcsControllers.sendMesgToGroup(
                                curUnit.groupId,
                                "G: Please Land Before Attempting Logistic Commands!",
                                5
                            );
                        } else {
                            // real sling loading
                            if (curUnit.inAir) {
                                await ddcsControllers.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: Please Land Before Attempting Logistic Commands!",
                                    5
                                );
                            } else {
                                const chkPlayer = await ddcsControllers.srvPlayerActionsRead({name: curUnit.playername});
                                const curChkPlayer = chkPlayer[0];
                                if (curChkPlayer) {

                                    const crateUpdate = await ddcsControllers.staticCrateActionRead({});
                                    const sendClient = {
                                        action: "CRATEUPDATE",
                                        crateNames: _.map(crateUpdate, "_id"),
                                        callback: "unpackCrate",
                                        unitId: pObj.unitId
                                    };
                                    const actionObj = {actionObj: sendClient, queName: "clientArray"};
                                    await ddcsControllers.sendUDPPacket("frontEnd", actionObj);
                                }
                            }
                        }
                    }
                    break;
                case "Soldier":
                    await loadTroops(pObj.unitId, "Soldier");
                    break;
                case "MG Soldier":
                    await loadTroops(pObj.unitId, "MG Soldier");
                    break;
                case "MANPAD":
                    await loadTroops(pObj.unitId, "MANPAD");
                    break;
                case "RPG":
                    await loadTroops(pObj.unitId, "RPG");
                    break;
                case "Mortar Team":
                    await loadTroops(pObj.unitId, "Mortar Team");
                    break;
                case "acquisitionCnt":
                    const unitsOwned = await ddcsControllers.unitActionRead({
                        playerOwnerId: curPlayer.ucid,
                        isCrate: false,
                        isTroop: false,
                        dead: false
                    });
                    const grpGroups = _.transform(unitsOwned, (result: any, value: any) => {
                        (result[value.groupName] || (result[value.groupName] = [])).push(value);
                    }, {});

                    await ddcsControllers.sendMesgToGroup(
                        curUnit.groupId,
                        "G: You Have " + _.size(grpGroups) + "/" + engineCache.config.maxUnitsMoving + " Unit Acquisitions In Play!",
                        10
                    );
                    break;
                case "EWR":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "JTAC":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "jtac", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "reloadGroup":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "reloadGroup", pObj.mobile, pObj.mass, "container_cargo");
                    break;
                case "repairBase":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "repairBase", pObj.mobile, pObj.mass, "container_cargo");
                    break;
                case "unarmedFuel":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "unarmedAmmo":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "armoredCar":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "APC":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "tank":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "artillary":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "mlrs":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "stationaryAntiAir":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "mobileAntiAir":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "samIR":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "mobileSAM":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "MRSAM":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "LRSAM":
                    await spawnCrateFromLogi(curUnit, pObj.type, pObj.crates, "", "", pObj.mobile, pObj.mass, defCrate);
                    break;
                case "spawnBomber":
                    await spawnBomber(curUnit, curPlayer, pObj.type, pObj.rsCost);
                    break;
                case "spawnAtkHeli":
                    await spawnAtkHeli(curUnit, curPlayer, pObj.type, pObj.rsCost);
                    break;
                case "spawnDefHeli":
                    await spawnDefHeli(curUnit, curPlayer, pObj.type, pObj.rsCost);
                    break;
                case "spawnAWACS":
                    await spawnAWACS(curUnit, curPlayer, pObj.type, pObj.rsCost);
                    break;
                case "spawnTanker":
                    await spawnTanker(curUnit, curPlayer, pObj.type, pObj.rsCost);
                    break;
                case "InternalCargo":
                    await internalCargo(curUnit, curPlayer, pObj.type);
                    break;
            }
        }
    }
}

export async function spawnAtkHeli(curUnit: typing.IUnit, curPlayer: typing.ISrvPlayers, heliType: string, rsCost: number) {
    console.log("HeliType: ", heliType, rsCost);

    let heliObj: any;
    if (heliType === "RussianAtkHeli") {
        heliObj = {
            name: "RussianAtkHeli",
            type: "Mi-28N",
            country: "RUSSIA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }
    if (heliType === "USAAtkHeli") {
        heliObj = {
            name: "USAAtkHeli",
            type: "AH-64D",
            country: "USA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }

    const spentPoints = await ddcsControllers.spendResourcePoints(curPlayer, rsCost, "AtkHeli", heliObj);
    if (spentPoints) {
        await ddcsControllers.spawnAtkChopper(curUnit, heliObj);
    }
}

export async function spawnAWACS(curUnit: typing.IUnit, curPlayer: typing.ISrvPlayers, awacsType: string, rsCost: number) {
    console.log("AWACSType: ", awacsType, rsCost);

    let awacsObj: any;
    if (awacsType === "RussianAWACSA50") {
        awacsObj = {
            name: "RussianAWACSA50",
            type: "A-50",
            country: "RUSSIA",
            alt: "7620",
            speed: "265",
            radioFreq: 138000000,
            spawnDistance: 50,
            callsign: 50,
            onboard_num: 250,
            details: "(CALLSIGN: Overlord, Freq: 138Mhz AM)",
            hidden: false,
            eplrs: false
        };
    }
    if (awacsType === "RussianAWACSE2C") {
        awacsObj = {
            name: "RussianAWACSE2C",
            type: "E-2C",
            country: "AGGRESSORS",
            alt: "7620",
            speed: "265",
            radioFreq: 137000000,
            spawnDistance: 50,
            callsign: 50,
            onboard_num: 251,
            details: "(CALLSIGN: Chacha, Freq: 137Mhz AM)",
            hidden: false,
            eplrs: true
        };
    }
    if (awacsType === "USAAWACS") {
        awacsObj = {
            name: "USAAWACS",
            type: "E-3A",
            country: "USA",
            alt: "7620",
            speed: "265",
            radioFreq: 139000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Overlord11"
            },
            onboard_num: 249,
            details: "(CALLSIGN: Overlord, Freq: 139Mhz AM)",
            hidden: false,
            eplrs: true
        };
    }

    const spentPoints = await ddcsControllers.spendResourcePoints(curPlayer, rsCost, "AWACS", awacsObj);
    if (spentPoints) {
        await ddcsControllers.spawnAWACSPlane(curUnit, awacsObj);
    }
}

export async function spawnBomber(curUnit: any, curPlayer: any, bomberType: string, rsCost: number) {
    console.log("BomberType: ", bomberType, rsCost);

    let bomberObj: any;
    if (bomberType === "RussianBomber") {
        bomberObj = {
            name: "RussianBomber",
            type: "Su-25M",
            country: "RUSSIA",
            alt: "2000",
            speed: "233",
            spawnDistance: 50,
            details: "(3 * Su-24M)",
            hidden: false
        };
    }
    if (bomberType === "USABomber") {
        bomberObj = {
            name: "USABomber",
            type: "B-1B",
            country: "USA",
            alt: "2000",
            speed: "233",
            spawnDistance: 50,
            details: "(1 * B-1B)",
            hidden: false
        };
    }

    const spentPoints = await ddcsControllers.spendResourcePoints(curPlayer, rsCost, "Bomber", bomberObj);
    if (spentPoints) {
        await ddcsControllers.spawnBomberPlane(curUnit, bomberObj);
    }
}

export async function spawnCrateFromLogi(
    unit: any,
    type: string,
    crates: string,
    combo: string,
    special: string,
    mobile: boolean,
    mass: number,
    crateType: string
) {
    const engineCache = ddcsControllers.getEngineCache();
    let spc: string;
    let crateObj;
    let crateCount = 0;
    if (special) {
        spc = special;
    } else {
        spc = "";
    }

    if (unit.inAir) {
        await ddcsControllers.sendMesgToGroup(
            unit.groupId,
            "G: Please Land Before Attempting Logistic Commands!",
            5
        );
    } else {
        const player = await ddcsControllers.srvPlayerActionsRead({name: unit.playername});
        const curPlayer = player[0];
        let closeLogi = "";
        const normalCrateBases = await ddcsControllers.baseActionRead({});
        const checkAllBase: any[] = [];
        let curLogistic;
        const aliveBases = await ddcsControllers.unitActionRead({_id:  /Logistics/, dead: false, coalition: unit.coalition});
        for (const base of normalCrateBases) {
            curLogistic = _.find(aliveBases, {name: base.name + " Logistics"});
            closeLogi = _.get(base, "name");
            if (!!curLogistic) {
                checkAllBase.push(await ddcsControllers.isPlayerInProximity(
                    curLogistic.lonLatLoc,
                    0.2,
                    unit.playername
                ));
            }
        }
        if (_.some(checkAllBase)) {
            const delCrates = await ddcsControllers.staticCrateActionRead({playerOwnerId: curPlayer.ucid});
            for (const crate of delCrates) {
                if (crateCount > engineCache.config.maxCrates - 2) {
                    await ddcsControllers.staticCrateActionDelete({
                        _id: crate._id
                    });
                    await ddcsControllers.destroyUnit(crate._id, "static");
                }
                crateCount++;
            }
            let curShapeName: string;
            const curCrate = _.find(engineCache.staticDictionary, {_id: crateType});
            if (curCrate) {
                curShapeName = curCrate.shape_name;
            } else {
                curShapeName = "iso_container_small_cargo";
            }
            crateObj = {
                name: (spc) ? spc + "|#" + _.random(1000000, 9999999) : type +
                    "|" + closeLogi + "|#" + _.random(1000000, 9999999),
                unitLonLatLoc: unit.lonLatLoc,
                shape_name: curShapeName,
                category: "Cargo",
                type: crateType,
                heading: unit.hdg,
                canCargo: true,
                mass,
                playerOwnerId: curPlayer.ucid,
                templateName: type,
                special: spc,
                crateAmt: crates,
                isCombo: combo,
                playerCanDrive: mobile,
                country: ddcsControllers.defCountrys[unit.coalition],
                side: unit.coalition,
                coalition: unit.coalition
            };
            await ddcsControllers.spawnLogiCrate(crateObj, true);

            await ddcsControllers.sendMesgToGroup(
                unit.groupId,
                "G: " + _.toUpper(spc) + " " + type + " crate has been spawned!",
                5
            );
        } else {
            await ddcsControllers.sendMesgToGroup(
                unit.groupId,
                "G: You are not close enough to the command center to spawn a crate!",
                5
            );
        }
    }
}

export async function spawnDefHeli(curUnit: any, curPlayer: any, heliType: string, rsCost: number) {
    console.log("HeliType: ", heliType, rsCost);

    let heliObj: any;
    if (heliType === "RussianDefHeli") {
        heliObj = {
            name: "RussianDefHeli",
            type: "Mi-24V",
            country: "RUSSIA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }
    if (heliType === "USADefHeli") {
        heliObj = {
            name: "USADefHeli",
            type: "AH-1W",
            country: "USA",
            alt: "1000",
            speed: "55",
            hidden: false
        };
    }

    const spentPoints = await ddcsControllers.spendResourcePoints(curPlayer, rsCost, "DefHeli", heliObj);
    if (spentPoints) {
        await ddcsControllers.spawnDefenseChopper(curUnit, heliObj);
    }
}

export async function spawnTanker(curUnit: any, curPlayer: any, tankerType: string, rsCost: number) {
    let tankerObj: any;
    const safeSpawnDistance: number = 100;
    let remoteLoc: number[];
    console.log("tankerType: ", tankerType, rsCost);

    if (tankerType === "BHABTKR") {
        tankerObj = {
            name: "BHABTKR",
            type: "KC-135",
            country: "USA",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: true,
                channel: 33,
                modeChannel: "Y",
                frequency: 1120000000
            },
            radioFreq: 125000000,
            spawnDistance: 50,
            callsign: {
                1: 2,
                2: 1,
                3: 1,
                name: "Arco11"
            },
            onboard_num: 135,
            details: "(TACAN: 33X, CALLSIGN: Arco, Freq: 125Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BHADTKR") {
        tankerObj = {
            name: "BHADTKR",
            type: "IL-78M",
            country: "UKRAINE",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: false
            },
            radioFreq: 126000000,
            spawnDistance: 50,
            callsign: 78,
            onboard_num: 78,
            details: "(CALLSIGN: 78, Freq: 126Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BLABTKR") {
        tankerObj = {
            name: "BLABTKR",
            type: "KC-135",
            country: "USA",
            alt: "4572",
            speed: "118.19444444444",
            tacan: {
                enabled: true,
                channel: 35,
                modeChannel: "Y",
                frequency: 1122000000
            },
            radioFreq: 127500000,
            spawnDistance: 50,
            callsign: {
                1: 3,
                2: 1,
                3: 1,
                name: "Shell11"
            },
            onboard_num: 135,
            details: "(TACAN: 35X, CALLSIGN: Shell, Freq: 127.5Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "BLADTKR") {
        tankerObj = {
            name: "BLADTKR",
            type: "KC130",
            country: "USA",
            alt: "4572",
            speed: "169.58333333333",
            tacan: {
                enabled: true,
                channel: 36,
                modeChannel: "Y",
                frequency: 1123000000
            },
            radioFreq: 128000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Texaco11"
            },
            onboard_num: 130,
            details: "(TACAN: 36X, CALLSIGN: Texaco, Freq: 128Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RHADTKR") {
        tankerObj = {
            name: "RHADTKR",
            type: "IL-78M",
            country: "RUSSIA",
            alt: "7620",
            speed: "265",
            tacan: {
                enabled: false
            },
            radioFreq: 130000000,
            spawnDistance: 50,
            callsign: 78,
            onboard_num: 78,
            details: "(CALLSIGN: 78, Freq: 130Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RLABTKR") {
        tankerObj = {
            name: "RLABTKR",
            type: "KC-135",
            country: "AGGRESSORS",
            alt: "4572",
            speed: "118.19444444444",
            tacan: {
                enabled: true,
                channel: 43,
                modeChannel: "Y",
                frequency: 1130000000
            },
            radioFreq: 131000000,
            spawnDistance: 50,
            callsign: {
                1: 1,
                2: 1,
                3: 1,
                name: "Texaco11"
            },
            onboard_num: 135,
            details: "(TACAN: 43X, CALLSIGN: Texaco, Freq: 131Mhz AM)",
            hidden: false
        };
    }
    if (tankerType === "RLADTKR") {
        tankerObj = {
            name: "RLADTKR",
            type: "KC130",
            country: "RUSSIA",
            alt: "4572",
            speed: "169.58333333333",
            tacan: {
                enabled: true,
                channel: 44,
                modeChannel: "Y",
                frequency: 1131000000
            },
            radioFreq: 132000000,
            spawnDistance: 50,
            callsign: 130,
            onboard_num: 130,
            details: "(TACAN: 44X, CALLSIGN: 130, Freq: 132Mhz AM)",
            hidden: false
        };
    }

    remoteLoc = await ddcsControllers.getLonLatFromDistanceDirection(curUnit.lonLatLoc, curUnit.hdg, tankerObj.spawnDistance);

    const closeMOBs1 = await ddcsControllers.getMOBsInProximity(
        remoteLoc,
        safeSpawnDistance,
        ddcsControllers.enemyCountry[curUnit.coalition]
    );
    const closeMOBs2 = await ddcsControllers.getMOBsInProximity(
        curUnit.lonLatLoc,
        safeSpawnDistance,
        ddcsControllers.enemyCountry[curUnit.coalition]
    );

    if (closeMOBs1.length > 0 || closeMOBs2.length > 0) {
        await ddcsControllers.sendMesgToGroup(
            curUnit.groupId,
            "G: Please spawn Tanker farther away from enemy bases!",
            5
        );
    } else {
        const spentPoints = await ddcsControllers.spendResourcePoints(curPlayer, rsCost, "Tanker", tankerObj);
        if (spentPoints) {
            await ddcsControllers.spawnTankerPlane(curUnit, tankerObj, curUnit.lonLatLoc, remoteLoc);
        }
    }
}

export async function unpackCrate(playerUnit: any, country: string, type: string, special: string, combo: boolean, mobile: boolean) {
    const engineCache = ddcsControllers.getEngineCache();
    const curTimePeriod = engineCache.config.timePeriod || "modern";
    if (playerUnit.inAir) {
        await ddcsControllers.sendMesgToGroup(
            playerUnit.groupId,
            "G: Please Land Before Attempting Logistic Commands!",
            5
        );
        return false;
    } else {
        const player = await ddcsControllers.srvPlayerActionsRead({name: playerUnit.playername});
        const curPlayer = player[0];
        const delUnits = await ddcsControllers.unitActionReadStd({
            playerOwnerId: curPlayer.ucid,
            playerCanDrive: mobile,
            isCrate: false,
            dead: false
        });
        let curUnit = 0;
        const grpGroups = _.groupBy(delUnits, "groupName");
        const tRem = Object.keys(grpGroups).length - engineCache.config.maxUnitsMoving;

        for (const gUnitKey of Object.keys(grpGroups)) {
            if (curUnit <= tRem) {
                for (const unit of grpGroups[gUnitKey]) {
                    await ddcsControllers.unitActionUpdateByUnitId({unitId: unit.unitId, dead: true});
                    await ddcsControllers.destroyUnit(unit.name, "unit");
                }
                curUnit++;
            }
        }

        const newSpawnArray: any[] = [];
        if (combo) {
            const addHdg = 30;
            let curUnitHdg = playerUnit.hdg;
            const findUnits = _.filter(engineCache.unitDictionary, (curUnitDict) => {
                return _.includes(curUnitDict.comboName, type);
            });
            for (const cbUnit of findUnits) {
                const spawnUnitCount = cbUnit.config[curTimePeriod].spawnCount;
                for (let x = 0; x < spawnUnitCount; x++) {
                    if (curUnitHdg > 359) {
                        curUnitHdg = 30;
                    }
                    const unitStart = {
                        ...cbUnit,
                        spwnName: "DU|" + curPlayer.ucid + "|" + cbUnit.type + "|" + special + "|true|" + mobile + "|" +
                            curPlayer.name + "|" + _.random(10000, 99999),
                        lonLatLoc: playerUnit.lonLatLoc,
                        heading: curUnitHdg,
                        country,
                        playerCanDrive: mobile,
                        coalition: playerUnit.coalition
                    };

                    newSpawnArray.push(unitStart);
                    curUnitHdg = curUnitHdg + addHdg;
                }
            }
            await ddcsControllers.spawnUnitGroup(newSpawnArray, false);
            return true;
        } else {
            const addHdg = 30;
            let curUnitHdg = playerUnit.hdg;
            let unitStart;
            let pCountry = country;
            const findUnit = _.find(engineCache.unitDictionary, {_id: type});

            if (findUnit) {
                const spawnUnitCount = findUnit.config[curTimePeriod].spawnCount;
                if ((type === "1L13 EWR" || type === "55G6 EWR" || type === "Dog Ear radar") && _.get(playerUnit, "coalition") === 2) {
                    console.log("EWR: UKRAINE");
                    pCountry = "UKRAINE";
                }

                for (let x = 0; x < spawnUnitCount; x++) {
                    unitStart = _.cloneDeep(findUnit);
                    if (curUnitHdg > 359) {
                        curUnitHdg = 30;
                    }
                    if (special === "jtac") {
                        _.set(unitStart, "spwnName", "DU|" + curPlayer.ucid + "|" + type + "|" + special +
                            "|true|" + mobile + "|" + curPlayer.name + "|");
                    } else {
                        _.set(unitStart, "spwnName", "DU|" + curPlayer.ucid + "|" + type + "|" + special +
                            "|true|" + mobile + "|" + curPlayer.name + "|" + _.random(10000, 99999));
                    }

                    unitStart = {
                        ...unitStart,
                        lonLatLoc: playerUnit.lonLatLoc,
                        heading: curUnitHdg,
                        country: pCountry,
                        playerCanDrive: mobile,
                        special,
                        coalition: playerUnit.coalition
                    };

                    newSpawnArray.push(unitStart);
                    curUnitHdg = curUnitHdg + addHdg;
                }
                await ddcsControllers.spawnUnitGroup(newSpawnArray, false);
                return true;
            } else {
                console.log("Count not find unit: line 1172: ", type);
                return false;
            }
        }
    }
}
