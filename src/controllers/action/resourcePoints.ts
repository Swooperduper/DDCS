/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {I18nResolver} from "i18n-ts";

export async function spendResourcePoints(
    player: typings.ISrvPlayers,
    rsCost: number,
    rsItem: string,
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
            if (unitExist.length > 0 && rsItem === "Tanker") {
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
                    if (player.redRSPoints >= rsCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            redRSPoints: player.redRSPoints - rsCost
                        };
                        await ddcsControllers.srvPlayerActionsUpdate(currentObjUpdate);
                        message = "G: " + i18n.YOUHAVESPENTRSPOINTS.replace("#1", i18n[1])
                            .replace("#2", rsCost).replace("#3", rsItem).replace("#4", currentObjUpdate.redRSPoints);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return true;
                    } else {
                        message = "G: " + i18n.YOUDONTHAVEENOUGHRSPOINTSTOBUY.replace("#1", i18n[1])
                            .replace("#2", rsCost).replace("#3", rsItem).replace("#4", player.redRSPoints);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return false;
                    }
                } else {
                    if (player.blueRSPoints >= rsCost) {
                        currentObjUpdate = {
                            _id: player._id,
                            blueRSPoints: player.blueRSPoints - rsCost
                        };
                        await ddcsControllers.srvPlayerActionsUpdate(currentObjUpdate);
                        message = "G: " + i18n.YOUHAVESPENTRSPOINTS.replace("#1", i18n[2])
                            .replace("#2", rsCost).replace("#3", rsItem).replace("#4", currentObjUpdate.blueRSPoints);
                        await ddcsControllers.sendMesgToGroup(
                            player,
                            curUnit.groupId,
                            message,
                            5
                        );
                        return true;
                    } else {
                        message = "G: " + i18n.YOUDONTHAVEENOUGHRSPOINTSTOBUY.replace("#1", i18n[2])
                            .replace("#2", rsCost).replace("#3", rsItem).replace("#4", player.blueRSPoints);
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
            message = "G: " + i18n.YOUCANNOTSPENDRSPOINTSONGROUND;
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

export async function checkTempWarbonds(player: typings.ISrvPlayers): Promise<void> {
    if (player.name) {
        const engineCache = ddcsControllers.getEngineCache();
        const i18n = new I18nResolver(engineCache.i18n, player.lang).translation as any;
        const cUnit = await ddcsControllers.unitActionRead({dead: false, playername: player.name});
        let message;
        if (cUnit.length > 0) {
            message = "G: You have earned "+player.tmpWarbonds+" Temp Warbonds. \n When you land these will be added to your account in addiition to the refunded cost of your airframe plus any onboard munitions.";


            await ddcsControllers.sendMesgToGroup(
                player,
                cUnit[0].groupId,
                message,
                5
            );
        }
    }
}
