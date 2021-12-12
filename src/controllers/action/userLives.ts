/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {I18nResolver} from "i18n-ts";

export function getWeaponCost(typeName: string, count: number): number {
    const engineCache = ddcsControllers.getEngineCache();
    let mantraCHK = 0;

    if (typeName === "MATRA") { mantraCHK += count; }
    const curWeaponLookup = _.find(engineCache.weaponsDictionary, {_id: typeName} );
    if (curWeaponLookup) {
        const foxAllowance = (mantraCHK > 2) ? 0 : (count > 2) ? 0 : curWeaponLookup.fox2ModUnder2 || 0;
        return curWeaponLookup.tier || 0 + foxAllowance;
    }
    console.log("cant find weapon: line17 ", typeName);
    return 0;
}

export async function getPlayerBalance(): Promise<typings.ISrvPlayerBalance> {
    const serverAlloc: any = {};
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    if (latestSession.name) {
        const playerArray = await ddcsControllers.srvPlayerActionsRead({sessionName: latestSession.name});
        for (const ePlayer of playerArray) {
            if ((new Date(ePlayer.updatedAt).getTime() + ddcsControllers.time.oneMin > new Date().getTime()) && ePlayer.slot !== "") {
                serverAlloc[ePlayer.side] = serverAlloc[ePlayer.side] || [];
                serverAlloc[ePlayer.side].push(ePlayer);
            }
        }
        const redAll = _.size(_.get(serverAlloc, 1));
        const blueAll = _.size(_.get(serverAlloc, 2));
        if (redAll > blueAll && redAll !== 0) {
            return {
                side: 1,
                modifier: 2 / (blueAll / redAll),
                players: playerArray
            };
        } else if (redAll < blueAll && blueAll !== 0) {
            return {
                side: 2,
                modifier: 2 / (redAll / blueAll),
                players: playerArray
            };
        }
    }
    return {
        side: 0,
        modifier: 1
    };
}

export async function updateServerLifePoints(): Promise<void> {
    let addFracPoint;
    const playerBalance = await getPlayerBalance();

    console.log("UPDATING LIFE POINTS");
    if (playerBalance.players && playerBalance.players.length > 0) {
        for (const cPlayer of playerBalance.players) {
            if (cPlayer) {
                if (!_.isEmpty(cPlayer.name)) {
                    const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: cPlayer.name});
                    const curUnit = cUnit[0];
                    if (cPlayer.side === playerBalance.side) {
                        addFracPoint = 1;
                    } else {
                        addFracPoint = playerBalance.modifier;
                    }
                    await addLifePoints(
                        cPlayer,
                        curUnit || null,
                        "PeriodicAdd",
                        addFracPoint
                    );
                }
            }
        }
    }
}

export async function lookupWarBonds(playerUcid: string): Promise<void> {
    const srvPlayer = await ddcsControllers.srvPlayerActionsRead({_id: playerUcid});
    const curPlayer = srvPlayer[0];
    if (curPlayer) {
        const engineCache = ddcsControllers.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;

        if (curPlayer.name) {
            const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: curPlayer.name});
            const curUnit = cUnit[0];
            const message = "G: " + i18n.WARBONDS.replace("#1", curPlayer.curLifePoints.toFixed(2));
            await ddcsControllers.sendMesgToGroup(curPlayer, curUnit.groupId, message, 5);
        }
    }
}

export async function lookupAircraftCosts(playerUcid: string): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const srvPlayer = await ddcsControllers.srvPlayerActionsRead({_id: playerUcid});
    if (srvPlayer.length > 0) {
        const curPlayer = srvPlayer[0];
        if (curPlayer) {
            const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;
            if (curPlayer.name) {
                const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: curPlayer.name});
                if (cUnit.length > 0) {
                    const curUnit = cUnit[0];
                    const curUnitDictionary = _.find(engineCache.unitDictionary, {_id: curUnit.type});
                    if (curUnitDictionary) {
                        const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
                        let curTopWeaponCost = 0;
                        let curTopAmmo = "";
                        let totalTakeoffCosts;
                        for (const value of curUnit.ammo || []) {
                            const weaponCost = getWeaponCost(value.typeName, value.count);
                            if (curTopWeaponCost < weaponCost) {
                                const curAmmoArray = _.split(value.typeName, ".");
                                curTopAmmo = curAmmoArray[curAmmoArray.length - 1];
                                curTopWeaponCost = weaponCost;
                            }
                        }
                        totalTakeoffCosts = curUnitLPCost + curTopWeaponCost;

                        const messages = "G: " + i18n.YOURAIRCRAFTCOSTS.replace("#1", totalTakeoffCosts).replace("#2", curUnitLPCost)
                            .replace("#3", curUnit.type).replace("#4", curTopWeaponCost).replace("#5", curTopAmmo);

                        await ddcsControllers.sendMesgToGroup(curPlayer, curUnit.groupId, messages, 5);
                    } else {
                        console.log("cant find unit in dictionary: line 129");
                        console.log("lookup unit: ", curUnit);
                    }
                }
            }
        }
    }
}

export async function checkAircraftCosts(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    let message: string;

    if (latestSession && latestSession.name) {
        const srvPlayers = await ddcsControllers.srvPlayerActionsRead({sessionName: latestSession.name, playername: {$ne: ""}});
        for (const curPlayer of srvPlayers) {
            const i18n = new I18nResolver(engineCache.i18n, curPlayer.lang).translation as any;
            if (curPlayer.name) {
                const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: curPlayer.name});
                if (cUnit.length > 0) {
                    const curUnit = cUnit[0];
                    const curUnitDictionary = _.find(engineCache.unitDictionary, {_id: curUnit.type});
                    const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
                    let curTopWeaponCost = 0;
                    let totalTakeoffCosts;
                    for (const value of curUnit.ammo || []) {
                        const weaponCost = getWeaponCost(value.typeName, value.count);
                        curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
                    }
                    totalTakeoffCosts = curUnitLPCost + curTopWeaponCost;
                    if ((curPlayer.curLifePoints || 0) < totalTakeoffCosts && !curUnit.inAir) {
                        message = "G: " + i18n.YOUDONOTHAVEENOUGHWARBONDS.replace("#1", curUnit.type)
                            .replace("#2", totalTakeoffCosts.toFixed(2)).replace("#3", curPlayer.curLifePoints.toFixed(2));
                        console.log(curPlayer.name + " " + message);
                        await ddcsControllers.sendMesgToGroup(curPlayer, curUnit.groupId, message, 30);
                    }
                }
            }
        }
    }
}

export async function addLifePoints(curPlayer: any, curUnit: any, execAction?: string, addLP?: number): Promise<void> {
    const groupId = (curUnit && curUnit.groupId) ? curUnit.groupId : null;

    await ddcsControllers.srvPlayerActionsAddLifePoints({
        _id: curPlayer._id,
        groupId,
        addLifePoints: addLP,
        execAction
    });
}

export async function removeLifePoints(
    curPlayer: any,
    curUnit: any,
    execAction: string,
    isDirect?: boolean,
    removeLP?: number
): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    let curRemoveLP = removeLP;
    if (!isDirect) {
        const curUnitDictionary = _.find(engineCache.unitDictionary, {_id: curUnit.type});
        const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
        let curTopWeaponCost = 0;
        for (const value of curUnit.ammo || []) {
            const weaponCost = getWeaponCost(value.typeName, value.count);
            curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
        }
        curRemoveLP = curUnitLPCost + curTopWeaponCost;
    }
    await ddcsControllers.srvPlayerActionsRemoveLifePoints({
        _id: curPlayer._id,
        groupId: curUnit.groupId,
        removeLifePoints: curRemoveLP || 0,
        execAction,
        storePoints: !isDirect
    });
}
