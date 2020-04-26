/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function getPlayerBalance() {
    let blueAll: any;
    const nowTime = new Date().getTime();
    const oneMin = 60 * 1000;
    let redAll: any;
    const serverAlloc: any = {};
    return ddcsController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            if (latestSession.name) {
                return ddcsController.srvPlayerActionsRead({sessionName: latestSession.name})
                    .then((playerArray: any) => {
                        _.forEach(playerArray, (ePlayer) => {
                            if ((new Date(ePlayer.updatedAt).getTime() + oneMin > nowTime) && ePlayer.slot !== "") {
                                serverAlloc[ePlayer.side] = serverAlloc[ePlayer.side] || [];
                                serverAlloc[ePlayer.side].push(ePlayer);
                            }
                        });
                        redAll = _.size(_.get(serverAlloc, 1));
                        blueAll = _.size(_.get(serverAlloc, 2));
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
                        return {
                            side: 0,
                            modifier: 1,
                            players: playerArray
                        };
                    })
                    .catch((err) => {
                        console.log("line41", err);
                    });
            }
        })
        .catch((err) => {
            console.log("line50", err);
        });
}

export async function updateServerLifePoints() {
    let addFracPoint;

    console.log("UPDATING LIFE POINTS");
    exports.getPlayerBalance()
        .then((playerBalance: any) => {

            _.forEach(playerBalance.players, (cPlayer) => {
                if (cPlayer) {

                    if (!_.isEmpty(cPlayer.name)) {
                        ddcsController.unitActionRead({dead: false, playername: cPlayer.name})
                            .then((cUnit) => {
                                const curUnit = cUnit[0];
                                if (cPlayer.side === playerBalance.side) {
                                    addFracPoint = 1;
                                } else {
                                    addFracPoint = playerBalance.modifier;
                                }

                                if (curUnit) {
                                    exports.addLifePoints(
                                        cPlayer,
                                        curUnit,
                                        "PeriodicAdd",
                                        true,
                                        addFracPoint
                                    );
                                } else {
                                    exports.addLifePoints(
                                        cPlayer,
                                        null,
                                        "PeriodicAdd",
                                        true,
                                        addFracPoint
                                    );
                                }
                            })
                            .catch((err) => {
                                console.log("line81", err);
                            })
                        ;
                    }
                }
            });
        })
        .catch((err: any) => {
            console.log("line100", err);
        });
}

export async function lookupLifeResource(playerUcid: string) {
    ddcsController.srvPlayerActionsRead({_id: playerUcid})
        .then((srvPlayer) => {
            const curPlayer = _.get(srvPlayer, [0]);
            if (curPlayer) {
                if (curPlayer.name) {
                    ddcsController.unitActionRead({playername: curPlayer.name})
                        .then((cUnit: any) => {
                            const curUnit = cUnit[0];
                            ddcsController.sendMesgToGroup(
                                curUnit.groupId,
                                "G: You Have " + curPlayer.curLifePoints.toFixed(2) + " Life Resource Points.",
                                5
                            );
                        })
                        .catch((err) => {
                            console.log("line126", err);
                        });
                }
            }
        })
        .catch((err) => {
            console.log("line133", err);
        });
}

export async function lookupAircraftCosts(playerUcid: string) {
    ddcsController.srvPlayerActionsRead({_id: playerUcid})
        .then((srvPlayer: any) => {
            const curPlayer = srvPlayer[0];
            if (curPlayer) {
                if (curPlayer.name) {
                    ddcsController.unitActionRead({playername: curPlayer.name})
                        .then((cUnit: any) => {
                            if (cUnit.length > 0) {
                                const curUnit = cUnit[0];
                                const curUnitDictionary = _.find(ddcsController.unitDictionary, {_id: curUnit.type});
                                const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
                                let curTopWeaponCost = 0;
                                let curWeaponLookup;
                                let foxAllowance;
                                let mantraCHK = 0;
                                let curTopAmmo = "";
                                let totalTakeoffCosts;
                                let weaponCost;
                                _.forEach(curUnit.ammo || [], (value: any) => {
                                    if (value.typeName === "MATRA") { mantraCHK += value.count; }
                                    curWeaponLookup = _.find(ddcsController.weaponsDictionary, {_id: value.typeName} );
                                    foxAllowance = (value.count > 2) ? 0 : curWeaponLookup.fox2ModUnder2 || 0;
                                    foxAllowance = (mantraCHK > 2) ? 0 : foxAllowance;
                                    weaponCost = curWeaponLookup.tier || 0 + foxAllowance;
                                    if (curTopWeaponCost < weaponCost) {
                                        const curAmmoArray = _.split(value.typeName, ".");
                                        curTopAmmo = curAmmoArray[curAmmoArray.length - 1];
                                        curTopWeaponCost = weaponCost;
                                    }
                                });
                                totalTakeoffCosts = curUnitLPCost + curTopWeaponCost;
                                ddcsController.sendMesgToGroup(
                                    curUnit.groupId,
                                    "G: You aircraft costs " + totalTakeoffCosts.toFixed(2) + "( " + curUnitLPCost + "(" +
                                        curUnit.type + ")+" + curTopWeaponCost + "(" + curTopAmmo + ") ) Life Points.",
                                    5
                                );
                            }
                        })
                        .catch((err) => {
                            console.log("line12", err);
                        });
                }
            }
        })
        .catch((err) => {
            console.log("line133", err);
        });
}

export async function checkAircraftCosts() {
    ddcsController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            let mesg: string;
            if (latestSession.name) {
                ddcsController.srvPlayerActionsRead({sessionName: latestSession.name, playername: {$ne: ""}})
                    .then((srvPlayers: any) => {
                        _.forEach(srvPlayers, (curPlayer: any) => {
                            if (curPlayer.name) {
                                ddcsController.unitActionRead({dead: false, playername: curPlayer.name})
                                    .then((cUnit: any) => {
                                        if (cUnit.length > 0) {
                                            const curUnit = cUnit[0];
                                            const curUnitDictionary = _.find(ddcsController.unitDictionary, {_id: curUnit.type});
                                            const curUnitLPCost = (curUnitDictionary) ? curUnitDictionary.LPCost : 1;
                                            let curTopWeaponCost = 0;
                                            let foxAllowance;
                                            let mantraCHK = 0;
                                            let totalTakeoffCosts;
                                            let curWeaponLookup;
                                            let weaponCost;
                                            _.forEach(curUnit.ammo || [], (value) => {
                                                if (value.typeName === "MATRA") { mantraCHK += value.count; }
                                                curWeaponLookup = _.find(ddcsController.weaponsDictionary, {_id: value.typeName} );
                                                foxAllowance = (value.count > 2) ? 0 : curWeaponLookup.fox2ModUnder2 || 0;
                                                foxAllowance = (mantraCHK > 2) ? 0 : foxAllowance;
                                                weaponCost = curWeaponLookup.tier || 0 + foxAllowance;
                                                curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
                                            });
                                            totalTakeoffCosts = curUnitLPCost + curTopWeaponCost;
                                            if ((curPlayer.curLifePoints || 0) < totalTakeoffCosts && !curUnit.inAir) {
                                                mesg = "G: You Do Not Have Enough Points To Takeoff In " + curUnit.type + " + Loadout(" +
                                                    totalTakeoffCosts.toFixed(2) + "/" +
                                                    curPlayer.curLifePoints.toFixed(2) + "}";
                                                console.log(curPlayer.name + " " + mesg);
                                                ddcsController.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    mesg,
                                                    30
                                                );
                                            }
                                        }
                                    })
                                    .catch((err) => {
                                        console.log("line161", err);
                                    });
                            }
                        });
                    })
                    .catch((err) => {
                        console.log("line168", err);
                    });
            }
        })
        .catch((err) => {
            console.log("line180", err);
        })
    ;
}

export async function addLifePoints(curPlayer: any, curUnit: any, execAction?: string, addLP?: number) {
    return ddcsController.srvPlayerActionsAddLifePoints({
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
        let foxAllowance;
        let mantraCHK = 0;
        let curWeaponLookup;
        let weaponCost;
        _.forEach(curUnit.ammo || [], (value: any) => {
            if (value.typeName === "MATRA") { mantraCHK += value.count; }
            curWeaponLookup = _.find(ddcsController.weaponsDictionary, {_id: value.typeName} );
            foxAllowance = (value.count > 2) ? 0 : curWeaponLookup.fox2ModUnder2 || 0;
            foxAllowance = (mantraCHK > 2) ? 0 : foxAllowance;
            weaponCost = curWeaponLookup.tier || 0 + foxAllowance;
            curTopWeaponCost = (curTopWeaponCost > weaponCost) ? curTopWeaponCost : weaponCost;
        });
        curRemoveLP = curUnitLPCost + curTopWeaponCost;
    }
    return ddcsController.srvPlayerActionsRemoveLifePoints({
        _id: curPlayer._id,
        groupId: curUnit.groupId,
        removeLifePoints: curRemoveLP || 0,
        execAction,
        storePoints: !isDirect
    });
}
