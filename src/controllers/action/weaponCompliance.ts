/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../";

export async function checkWeaponComplianceOnTakeoff(iPlayer: any, curIUnit: any) {
    _.forEach(ddcsController.config.weaponRules || [], (weaponRule: any) => {
        const limitedWeapons: any[] = [];
        let maxLimitedWeaponCount = 0;
        _.forEach(curIUnit.ammo || [], (value: any) => {
            const curTypeName = value.typeName;
            if (_.includes(weaponRule.weapons, curTypeName)) {
                limitedWeapons.push(curTypeName);
                maxLimitedWeaponCount = maxLimitedWeaponCount + value.count;
            }
        });
        if (maxLimitedWeaponCount > weaponRule.maxTotalAllowed) {
            const msg = "Removed from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")";
            console.log("Removed " + iPlayer.name + " from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")");
            ddcsController.forcePlayerSpectator(
                iPlayer.playerId,
                msg
            );
            return false;
        }
    });
    return true;
}

export async function checkAircraftWeaponCompliance() {
    return ddcsController.sessionsActionsReadLatest()
        .then((latestSession: any) => {
            if (latestSession.name) {
                ddcsController.srvPlayerActionsRead({sessionName: latestSession.name, playername: {$ne: ""}})
                    .then((srvPlayers: any) => {
                        _.forEach(srvPlayers, (curPlayer: any) => {
                            ddcsController.unitActionRead({dead: false, playername: curPlayer.name})
                                .then((cUnit: any) => {
                                    if (cUnit.length > 0) {
                                        const curUnit = cUnit[0];
                                        _.forEach(ddcsController.config.weaponRules || [], (weaponRule: any) => {
                                            const limitedWeapons: any[] = [];
                                            let maxLimitedWeaponCount = 0;
                                            _.forEach(curUnit.ammo || [], (value: any) => {
                                                const curTypeName = value.typeName;
                                                if (curTypeName) {
                                                    ddcsController.weaponScoreActionsCheck({
                                                        typeName: curTypeName,
                                                        unitType: curUnit.type
                                                    });
                                                    if (_.includes(weaponRule.weapons, curTypeName)) {
                                                        limitedWeapons.push(curTypeName);
                                                        maxLimitedWeaponCount = maxLimitedWeaponCount + value.count;
                                                    }
                                                }
                                            });
                                            if (maxLimitedWeaponCount > weaponRule.maxTotalAllowed && !curUnit.inAir) {
                                                ddcsController.sendMesgToGroup(
                                                    curUnit.groupId,
                                                    "G: You have too many/banned weapons(" + maxLimitedWeaponCount + " of " +
                                                        _.join(limitedWeapons) + "), Max Allowed " + weaponRule.maxTotalAllowed,
                                                    30
                                                );
                                            }
                                        });
                                    }
                                })
                                .catch((err) => {
                                    console.log("line161", err);
                                });
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
