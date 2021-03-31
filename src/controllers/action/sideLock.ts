/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../";
import { dbModels } from "../db";
import * as typings from "../../typings";
import {I18nResolver} from "i18n-ts";

export async function lockUserToSide(incomingObj: any, lockToSide: number): Promise<void> {
    console.log("stuff1: ", incomingObj, lockToSide);
    return new Promise(async (resolve, reject) => {
        const curPlayerArray = await ddcsController.srvPlayerActionsRead({_id: incomingObj.from});
        const curPly = curPlayerArray[0];
        const engineCache = ddcsController.getEngineCache();
        console.log("stuff2: ", curPly, engineCache.i18n);
        const i18n = new I18nResolver(engineCache.i18n, curPly.lang).translation as any;
        console.log("stuff3: ", i18n.PLAYERALREADYLOCKEDTOSIDE, i18n.PLAYERISNOWLOCKEDTOSIDE);
        if (curPly && curPly.sideLock !== 0) {
            const mesg = i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
        } else {
            const mesg = i18n.PLAYERISNOWLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
            await ddcsController.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            dbModels.srvPlayerModel.updateOne(
                {_id: incomingObj.from},
                {$set: {sideLock: lockToSide}},
                (updateErr: any) => {
                    if (updateErr) { reject(updateErr); }
                    resolve();
                }
            );
        }
    });
}
