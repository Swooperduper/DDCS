/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../typings";
import * as ddcsControllers from "..";
import {I18nResolver} from "i18n-ts";

export async function spendWarBonds(
    player: typings.ISrvPlayers,
    warBondCost: number,
    warBondItem: string,
    itemObj: typings.IUnit
): Promise<boolean> {

    let curUnit: typings.IUnit;
    const engineCache = ddcsControllers.getEngineCache();
    const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
    if (isNaN(Number(player.slot))) {
        console.log("player doesnt have slotID: " + player);
        return Promise.resolve(false);
    } else {
        const cUnit = await ddcsControllers.unitActionRead({unitId: Number(player.slot)});
        let message;
        let currentObjUpdate: any;
        curUnit = cUnit[0];
        if (curUnit.inAir) {
            const unitExist = await ddcsControllers.unitActionRead({_id: "AI|" + itemObj.name + "|"});
            if (unitExist.length > 0 && warBondItem === "Tanker") {
                message = "G: " + i18n.TANKERSPAWNALREADYEXISTS;
                await ddcsControllers.sendMesgToGroup(
                    player,
                    curUnit.groupId,
                    message,
                    5
                );
                return false;
            } else {
                if (player.side === 1) {
                    if (player.redWarBonds >= warBondCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            redWarBonds: player.redWarBonds - warBondCost
                        };
                        await ddcsControllers.srvPlayerActionsUpdate(currentObjUpdate);
                        message = "G: " + i18n.YOUHAVESPENTWARBONDS.replace("#1", i18n[1])
                            .replace("#2", warBondCost).replace("#3", warBondItem).replace("#4", currentObjUpdate.redWarBonds);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return true;
                    } else {
                        message = "G: " + i18n.YOUDONTHAVEENOUGHRWARBONDSTOBUY.replace("#1", i18n[1])
                            .replace("#2", warBondCost).replace("#3", warBondItem).replace("#4", player.redWarBonds);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return false;
                    }
                } else {
                    if (player.blueWarBonds >= warBondCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            blueWarBonds: player.blueWarBonds - warBondCost
                        };
                        await ddcsControllers.srvPlayerActionsUpdate(currentObjUpdate);
                        message = "G: " + i18n.YOUHAVESPENTWARBONDS.replace("#1", i18n[2])
                            .replace("#2", warBondCost).replace("#3", warBondItem).replace("#4", currentObjUpdate.blueWarBonds);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return true;
                    } else {
                        message = "G: " + i18n.YOUDONTHAVEENOUGHRWARBONDSTOBUY.replace("#1", i18n[2])
                            .replace("#2", warBondCost).replace("#3", warBondItem).replace("#4", player.blueWarBonds);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return false;
                    }
                }
            }
        } else {
            message = "G: " + i18n.YOUCANNOTSPENDWARBONDSONGROUNDFORAIRASSETS;
            await ddcsControllers.sendMesgToGroup(
                player,
                curUnit.groupId,
                message,
                5
            );
            return false;
        }
    }
}

export async function checkWarBonds(player: typings.ISrvPlayers): Promise<void> {
    if (player.name) {
        const engineCache = ddcsControllers.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
        const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: player.name});
        let message;
        if (cUnit.length > 0) {
            if (player.side === 1) {
                message = "G: " + i18n.YOUHAVEWARBONDS.replace("#1", player.redWarBonds).replace("#2", i18n[1]);
            } else {
                message = "G: " + i18n.YOUHAVEWARBONDS.replace("#1", player.blueWarBonds).replace("#2", i18n[2]);
            }

            await ddcsControllers.sendMesgToGroup(
                player,
                cUnit[0].groupId,
                message,
                5
            );
        }
    }
}
