/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsControllers from "../";
import { dbModels } from "../db";
import * as typings from "../../typings";
import {I18nResolver} from "i18n-ts";


export async function lockUserToSide(incomingObj: any, lockToSide: number): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.srvPlayerModel.find({_id: incomingObj.from}, async (err: any, serverObj: typings.ISrvPlayers[]) => {
            if (err) { reject(err); }
            const curPly = serverObj[0];
            const i18n = new I18nResolver(ddcsControllers.engineCache.i18n.definitions, curPly.lang) as any;
            if (curPly && curPly.sideLock !== 0) {
                const mesg = i18n.PLAYERALREADYLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
                await ddcsControllers.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
            } else {
                const mesg = i18n.PLAYERISNOWLOCKEDTOSIDE.replace("#1", i18n[curPly.sideLock].toUpperCase());
                await ddcsControllers.sendMesgToPlayerChatWindow(mesg, curPly.playerId);
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
    });
}
