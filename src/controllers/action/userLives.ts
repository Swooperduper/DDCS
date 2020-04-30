/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export function getWeaponCost(typeName: string, count: number): number {
    let mantraCHK = 0;

    if (typeName === "MATRA") { mantraCHK += count; }
    const curWeaponLookup = _.find(ddcsController.weaponsDictionary, {_id: typeName} );
    const foxAllowance = (mantraCHK > 2) ? 0 : (count > 2) ? 0 : curWeaponLookup.fox2ModUnder2 || 0;
    return curWeaponLookup.tier || 0 + foxAllowance;
}

export async function getPlayerBalance(): Promise<ddcsController.ISrvPlayerBalance> {
    const serverAlloc: any = {};
    const latestSession = await ddcsController.sessionsActionsReadLatest();
    if (latestSession[0].name) {
        const playerArray = await ddcsController.srvPlayerActionsRead({sessionName: latestSession[0].name});
        for (const ePlayer of playerArray) {
            if ((new Date(ePlayer.updatedAt).getTime() + ddcsController.time.oneMin > new Date().getTime()) && ePlayer.slot !== "") {
                serverAlloc[ePlayer.side] = serverAlloc[ePlayer.side] || [];
                serverAlloc[ePlayer.side].push(ePlayer);
            }
        }
        const redAll = _.size(_.get(serverAlloc, 1));
        const blueAll = _.size(_.get(serverAlloc, 2));
        if (redAll > blueAll && redAll !== 0) {
            return {
                side: 1,
                modifier: 1 / (blueAll / redAll),
                players: playerArray
            };
        } else if (redAll < blueAll && blueAll !== 0) {
            return {
                side: 2,
                modifier: 1 / (redAll / blueAll),
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
                    const cUnit = await ddcsController.unitActionRead({dead: false, playername: cPlayer.name});
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

export async function lookupLifeResource(playerUcid: string): Promise<void> {
    const srvPlayer = await ddcsController.srvPlayerActionsRead({_id: playerUcid});
    const curPlayer = _.get(srvPlayer, [0]);
    if (curPlayer) {
        if (curPlayer.name) {
            const cUnit = await ddcsController.unitActionRead({playername: curPlayer.name});
            const curUnit = cUnit[0];
            await ddcsController.sendMesgToGroup(
                curUnit.groupId,
                "G: You Have " + curPlayer.curLifePoints.toFixed(2) + " Life Resource Points.",
                5
            );
        }
    }
}

export async function lookupAircraftCosts(playerUcid: string): Promise<void> {
    const srvPlayer = await ddcsController.srvPlayerActionsRead({_id: playerUcid});
    const curPlayer = srvPlayer[0];
    if (curPlayer) {
        if (curPlayer.name) {
            const cUnit = await ddcsController.unitActionRead({playername: curPlayer.name});
            if (cUnit.length > 0) {
                const curUnit = cUnit[0];
                const curUnitDictionary = _.find(ddcsController.unitDictionary, {_id: curUnit.type});
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
                await ddcsController.sendMesgToGroup(
                    curUnit.groupId,
                    "G: You aircraft costs " + totalTakeoffCosts.toFixed(2) + "( " + curUnitLPCost + "(" +
                    curUnit.type + ")+" + curTopWeaponCost + "(" + curTopAmmo + ") ) Life Points.",
                    5
                );
            }
        }
    }
}

export async function checkAircraftCosts(): Promise<void> {
    const latestSession = await ddcsController.sessionsActionsReadLatest();
    let mesg: string;
    if (latestSession[0].name) {
        const srvPlayers = await ddcsController.srvPlayerActionsRead({sessionName: latestSession[0].name, playername: {$ne: ""}});
        for (const curPlayer of srvPlayers) {
            if (curPlayer.name) {
                const cUnit = await ddcsController.unitActionRead({dead: false, playername: curPlayer.name});
                if (cUnit.length > 0) {
                    const curUnit = cUnit[0];
                    const curUnitDictionary = _.find(ddcsController.unitDictionary, {_id: curUnit.type});
                    const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
                    let curTopWeaponCost = 0;
                    let totalTakeoffCosts;
                    for (const value of curUnit.ammo || []) {
                        const weaponCost = getWeaponCost(value.typeName, value.count);
                        curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
                    }
                    totalTakeoffCosts = curUnitLPCost + curTopWeaponCost;
                    if ((curPlayer.curLifePoints || 0) < totalTakeoffCosts && !curUnit.inAir) {
                        mesg = "G: You Do Not Have Enough Points To Takeoff In " + curUnit.type + " + Loadout(" +
                            totalTakeoffCosts.toFixed(2) + "/" +
                            curPlayer.curLifePoints.toFixed(2) + "}";
                        console.log(curPlayer.name + " " + mesg);
                        await ddcsController.sendMesgToGroup(
                            curUnit.groupId,
                            mesg,
                            30
                        );
                    }
                }
            }
        }
    }
}

export async function addLifePoints(curPlayer: any, curUnit: any, execAction?: string, addLP?: number): Promise<void> {
    await ddcsController.srvPlayerActionsAddLifePoints({
        _id: curPlayer._id,
        groupId: curUnit.groupId,
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
    let curRemoveLP = removeLP;
    if (!isDirect) {
        const curUnitDictionary = _.find(ddcsController.unitDictionary, {_id: curUnit.type});
        const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
        let curTopWeaponCost = 0;
        for (const value of curUnit.ammo || []) {
            const weaponCost = getWeaponCost(value.typeName, value.count);
            curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
        }
        curRemoveLP = curUnitLPCost + curTopWeaponCost;
    }
    await ddcsController.srvPlayerActionsRemoveLifePoints({
        _id: curPlayer._id,
        groupId: curUnit.groupId,
        removeLifePoints: curRemoveLP || 0,
        execAction,
        storePoints: !isDirect
    });
}
