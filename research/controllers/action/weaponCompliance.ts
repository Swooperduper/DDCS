/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../";
import * as localDb from "../db/local";
import * as playerLib from "../player";
import * as remoteDb from "../db/remote";

export async function checkWeaponComplianceOnTakeoff(iPlayer: any, curIUnit: any): Promise<boolean> {
    for (const weaponRule of constants.config.weaponRules || []) {
        const limitedWeapons: any[] = [];
        let maxLimitedWeaponCount = 0;
        for ( const value of curIUnit.ammo || []) {
            const curTypeName = value.typeName;
            if (_.includes(weaponRule.weapons, curTypeName)) {
                limitedWeapons.push(curTypeName);
                maxLimitedWeaponCount = maxLimitedWeaponCount + value.count;
            }
        }
        if (maxLimitedWeaponCount > weaponRule.maxTotalAllowed) {
            const msg = "Removed from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")";
            console.log("Removed " + iPlayer.name + " from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")");
            await playerLib.forcePlayerSpectator(
                iPlayer.playerId,
                msg
            );
            return false;
        }
    }
    return true;
}

export async function checkAircraftWeaponCompliance(): Promise<void> {
    const latestSession = await localDb.sessionsActionsReadLatest();
    if (latestSession[0].name) {
        const srvPlayers = await localDb.srvPlayerActionsRead({sessionName: latestSession[0].name, playername: {$ne: ""}});
        for (const curPlayer of srvPlayers) {
            const cUnit = await localDb.unitActionRead({dead: false, playername: curPlayer.name});
            if (cUnit.length > 0) {
                const curUnit = cUnit[0];
                for (const weaponRule of constants.config.weaponRules || []) {
                    const limitedWeapons: any[] = [];
                    let maxLimitedWeaponCount = 0;
                    for (const value of curUnit.ammo || []) {
                        const curTypeName = value.typeName;
                        if (curTypeName) {
                            await remoteDb.weaponScoreActionsCheck({
                                typeName: curTypeName,
                                unitType: curUnit.type
                            });
                            if (_.includes(weaponRule.weapons, curTypeName)) {
                                limitedWeapons.push(curTypeName);
                                maxLimitedWeaponCount = maxLimitedWeaponCount + value.count;
                            }
                        }
                    }
                    if (maxLimitedWeaponCount > weaponRule.maxTotalAllowed && !curUnit.inAir) {
                        await playerLib.sendMesgToGroup(
                            curUnit.groupId,
                            "G: You have too many/banned weapons(" + maxLimitedWeaponCount + " of " +
                            _.join(limitedWeapons) + "), Max Allowed " + weaponRule.maxTotalAllowed,
                            30
                        );
                    }
                }
            }
        }
    }
}
