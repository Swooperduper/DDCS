/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../typings";
import * as ddcsControllers from "../";
import {I18nResolver} from "i18n-ts";

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