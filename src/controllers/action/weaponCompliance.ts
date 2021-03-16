/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsControllers from "../";

export async function checkWeaponComplianceOnTakeoff(iPlayer: any, curIUnit: any): Promise<boolean> {
    const engineCache = ddcsControllers.getEngineCache();
    for (const weaponRule of engineCache.config.weaponRules || []) {
        const limitedWeapons: any[] = [];
        let maxLimitedWeaponCount = 0;
        for ( const value of curIUnit.ammo || []) {
            const curTypeName = value.typeName;
            if (_.includes(weaponRule.weapons, curTypeName)) {
                limitedWeapons.push(curTypeName);
                maxLimitedWeaponCount = maxLimitedWeaponCount + value.count;
            }
        }
        // console.log("weaponRestrictions: ", maxLimitedWeaponCount, " > ", weaponRule.maxTotalAllowed) ;
        if (maxLimitedWeaponCount > weaponRule.maxTotalAllowed) {
            const msg = "Removed from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")";
            console.log("Removed " + iPlayer.name + " from aircraft not complying with weapon restrictions, (" +
                maxLimitedWeaponCount + " of " + _.join(limitedWeapons) + ")");
            await ddcsControllers.forcePlayerSpectator(
                iPlayer.playerId,
                msg
            );
            return false;
        }
    }
    return true;
}

export async function checkAircraftWeaponCompliance(): Promise<void> {
    const engineCache = ddcsControllers.getEngineCache();
    const latestSession = await ddcsControllers.sessionsActionsReadLatest();
    if (latestSession && latestSession.name) {
        const srvPlayers = await ddcsControllers.srvPlayerActionsRead({sessionName: latestSession.name, playername: {$ne: ""}});
        for (const curPlayer of srvPlayers) {
            const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: curPlayer.name});
            if (cUnit.length > 0) {
                const curUnit = cUnit[0];
                // console.log("CU:", curUnit);
                for (const weaponRule of engineCache.config.weaponRules || []) {
                    const limitedWeapons: any[] = [];
                    let maxLimitedWeaponCount = 0;
                    for (const value of curUnit.ammo || []) {
                        const curTypeName = value.typeName;
                        if (curTypeName) {
                            await ddcsControllers.weaponScoreActionsCheck({
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
                        await ddcsControllers.sendMesgToGroup(
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
