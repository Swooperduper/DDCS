/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../../";

export let shootingUsers: any = {};

export async function checkShootingUsers(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const nowTime = new Date().getTime();
    const curKeys = _.keys(shootingUsers);
    if (curKeys.length > 0) {
        for (const shootKey of curKeys ) {
            if (shootingUsers[shootKey].startTime + 3000 < new Date().getTime()) {
                const shootObj = shootingUsers[shootKey].iCurObj;
                shootObj.score = 10;

                if (shootObj.iucid || shootObj.tucid) {
                    await ddcsControllers.sendToAll({payload: {action: "S_EVENT_HIT", data: _.cloneDeep(shootObj)}});
                    await ddcsControllers.simpleStatEventActionsSave(shootObj);
                }
                if (exports.shootingUsers[shootKey].isOwnedUnit) {
                    await ddcsControllers.srvPlayerActionsUnitAddToRealScore({
                        _id: shootObj.iOwnerId,
                        groupId: shootObj.groupId,
                        score: shootObj.score,
                        unitType: shootObj.iType,
                        unitCoalition: shootObj.iUnitCoalition
                    });
                } else {
                    await ddcsControllers.srvPlayerActionsAddTempScore({
                        _id: shootObj.iucid,
                        groupId: shootObj.groupId,
                        score: shootObj.score
                    });
                }
                if (ddcsControllers.UNIT_CATEGORY[shootObj.tUnit.category] === "GROUND_UNIT") {
                    await ddcsControllers.baseUnitUnderAttack(shootObj.tUnit);
                    if (engineCache.config.inGameHitMessages) {
                        console.log("shooting1: ", shootObj.msg);
                        await ddcsControllers.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + ddcsControllers.time.oneMin
                        );
                    }
                } else if (ddcsControllers.UNIT_CATEGORY[shootObj.iUnit.category] === "GROUND_UNIT") {
                    await ddcsControllers.baseUnitUnderAttack(shootObj.tUnit);
                    if (engineCache.config.inGameHitMessages || exports.shootingUsers[shootKey].isOwnedUnit) {
                        console.log("shooting2: ", shootObj.msg);
                        await ddcsControllers.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + ddcsControllers.time.oneMin
                        );
                    }
                } else {
                    if (engineCache.config.inGameHitMessages) {
                        console.log("shooting3: ", shootObj.msg);
                        await ddcsControllers.sendMesgToAll(
                            "A: " + shootObj.msg,
                            20,
                            nowTime + ddcsControllers.time.oneMin
                        );
                    }
                }
                delete exports.shootingUsers[shootKey];
            }
        }
    }
}

export async function processEventHit(eventObj: any): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const iUnitId = eventObj.data.arg3;
    const tUnitId = eventObj.data.arg4;
    let iPName: string = "";
    let tPName: string = "";
    let iCurObj: any;
    let iPlayer: any;
    let tPlayer: any;
    const nowTime = new Date().getTime();
    const iUnit = await ddcsControllers.unitActionRead({unitId: iUnitId});
    const tUnit = await ddcsControllers.unitActionRead({unitId: tUnitId});
    const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: ddcsControllers.getSessionName()});
    let isOwnedUnit = false;
    const oId = [];
    const iOwnerId = iUnit[0].playerOwnerId;
    const tOwnerId = tUnit[0].playerOwnerId;

    if (iOwnerId || tOwnerId) {
        if (iOwnerId) {
            oId.push(iOwnerId);
        }
        if (tOwnerId) {
            oId.push(tOwnerId);
        }
    }
    const ownerIds = await ddcsControllers.srvPlayerActionsRead({_id: {$in: oId}});
    iCurObj = {
        sessionName: ddcsControllers.getSessionName(),
        eventCode: ddcsControllers.shortNames[eventObj.action],
        iName: iUnit[0].playername,
        iType: iUnit[0].type,
        iOwnerId,
        tName: tUnit[0].playername,
        tOwnerId,
        displaySide: "A",
        roleCode: "I",
        showInChart: true,
        groupId: iUnit[0].groupId,
        iCoalition: iUnit[0].coalition,
        iUnit: iUnit[0],
        tUnit: tUnit[0]
    };

    for (const ownerId of ownerIds) {
        if (ownerId.ucid === iOwnerId) {
            iCurObj.iOwner = ownerId;
            iCurObj.iOwnerName = ownerId.name;
            iCurObj.iOwnerNamePretty = "(" + ownerId.name + ")";
        }
        if (ownerId.ucid === tOwnerId) {
            iCurObj.tOwner = ownerId;
            iCurObj.tOwnerName = ownerId.name;
            iCurObj.tOwnerNamePretty = "(" + ownerId.name + ")";
        }
    }

    if (iUnit[0]) {
        iPlayer = _.find(playerArray, {name: iUnit[0].playername});
        if (iPlayer) {
            iCurObj.iucid = iPlayer.ucid;
            iPName = iUnit[0].type + "(" + iUnit[0].playername + ")";
        } else {
            iPName = iUnit[0].type + iCurObj.iOwnerNamePretty;
            isOwnedUnit = true;
        }
    }

    if (tUnit[0] ) {
        tPlayer = _.find(playerArray, {name: tUnit[0].playername});
        if (tPlayer) {
            iCurObj.tucid = tPlayer.ucid;
            tPName = tUnit[0].type + "(" + tUnit[0].playername + ")";
        } else {
            tPName = tUnit[0].type + iCurObj.tOwnerNamePretty;
        }
    }

    if (iUnit[0].coalition !== tUnit[0].coalition) {
        const curWeapon = _.find(engineCache.weaponsDictionary, {_id: eventObj.data.arg7.typeName});

        if (curWeapon) {
            const curWeaponName = ( curWeapon.displayName) ?  curWeapon.displayName :  curWeapon._id;

            if (iCurObj.iucid || iCurObj.tucid || isOwnedUnit) {
                if (_.startsWith(curWeapon.name, "weapons.shells")) {
                    shootingUsers[iUnitId].count = shootingUsers[iUnitId].count + 1;
                    shootingUsers[iUnitId].startTime = new Date().getTime();
                    // exports.shootingUsers[iUnitId[.serverName = serverName;
                    shootingUsers[iUnitId].isOwnedUnit = isOwnedUnit;
                    shootingUsers[iUnitId].iUnitType = iCurObj.iType;
                    shootingUsers[iUnitId].iUnitCoalition = iCurObj.iCoalition;
                    iCurObj.msg =
                        ddcsControllers.side[iUnit[0].coalition] + " " + iPName + " has hit " +
                        ddcsControllers.side[tUnit[0].coalition] + " " + tPName + " " +
                        shootingUsers[iUnitId].count + " times with " + curWeaponName + " - +10";

                    shootingUsers[iUnitId].iCurObj = _.cloneDeep(iCurObj);
                } else {
                    iCurObj.score = curWeapon.score;
                    iCurObj.msg = ddcsControllers.side[iUnit[0].coalition] + " " + iPName + " has hit " +
                        ddcsControllers.side[tUnit[0].coalition] + " " + tPName + " with " + curWeaponName +
                        " - +" + curWeapon.score;

                    if (iCurObj.iucid || iCurObj.tucid) {
                        await ddcsControllers.sendToAll({payload: {
                                action: eventObj.action,
                                data: _.cloneDeep(iCurObj)
                            }});
                        await ddcsControllers.simpleStatEventActionsSave(iCurObj);
                    }
                    if (isOwnedUnit) {
                        await ddcsControllers.srvPlayerActionsUnitAddToRealScore({
                            _id: iCurObj.iOwnerId,
                            groupId: iCurObj.groupId,
                            score: iCurObj.score,
                            unitType: iCurObj.iType,
                            unitCoalition: iCurObj.iCoalition
                        });
                    } else {
                        await ddcsControllers.srvPlayerActionsAddTempScore({
                            _id: iCurObj.iucid,
                            groupId: iCurObj.groupId,
                            score: iCurObj.score
                        });
                    }
                    if (ddcsControllers.UNIT_CATEGORY[iCurObj.tUnit.category] === "GROUND_UNIT") {
                        await ddcsControllers.baseUnitUnderAttack(iCurObj.tUnit);
                        if (engineCache.config.inGameHitMessages) {
                            console.log("groundhit: ", iCurObj.msg);
                            await ddcsControllers.sendMesgToAll(
                                "A: " + iCurObj.msg,
                                20,
                                nowTime + ddcsControllers.time.oneMin
                            );
                        }
                    } else if (ddcsControllers.UNIT_CATEGORY[iCurObj.iUnit.category] === "GROUND_UNIT") {
                        if (engineCache.config.inGameHitMessages || isOwnedUnit) {
                            console.log("groundrecievehit: ", iCurObj.msg);
                            await ddcsControllers.sendMesgToAll(
                                "A: " + iCurObj.msg,
                                20,
                                nowTime + ddcsControllers.time.oneMin
                            );
                        }
                    } else {
                        if (engineCache.config.inGameHitMessages) {
                            console.log("reg hit: ", iCurObj.msg);
                            await ddcsControllers.sendMesgToAll(
                                "A: " + iCurObj.msg,
                                20,
                                nowTime + ddcsControllers.time.oneMin
                            );
                        }
                    }
                }
            }
        } else {
            // console.log('weapon not here');
            console.log("Weapon Unknown: ", eventObj.data.arg7.typeName);
            shootingUsers[iUnitId].count = exports.shootingUsers[iUnitId].count + 1;
            shootingUsers[iUnitId].startTime = new Date().getTime();
            // exports.shootingUsers, [iUnitId].serverName = serverName;
            shootingUsers[iUnitId].isOwnedUnit = isOwnedUnit;
            shootingUsers[iUnitId].iUnitType = iCurObj.iType;
            shootingUsers[iUnitId].iUnitCoalition = iCurObj.iCoalition;
            const shotCount = shootingUsers[iUnitId].count;
            iCurObj.msg =
                "A: " + ddcsControllers.side[iUnit[0].coalition] + " " + iPName + " has hit " +
                ddcsControllers.side[tUnit[0].coalition] + " " + tPName + " " + shotCount + " times with ? - +10";

            shootingUsers[iUnitId].iCurObj = _.cloneDeep(iCurObj);
        }
    }
}
