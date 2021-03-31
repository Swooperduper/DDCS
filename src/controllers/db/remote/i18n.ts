/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import { dbModels } from "../common";

export async function i18nActionsRead(): Promise<{}> {
    return new Promise((resolve, reject) => {
        dbModels.i18nModel.find({}, (err: any, definitions: any) => {
            if (err) { reject(err); }
            resolve(definitions);
        }).catch((err: any) => {
            console.log("ERR: ", err);
        });
    });
}
