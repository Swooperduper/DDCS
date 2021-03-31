/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import { dbModels } from "../common";

export async function i18nActionsCreate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = new dbModels.i18nModel(obj);
        server.save((err: any) => {
            if (err) { console.log("icreateerror: ", err); reject(err); }
            resolve();
        });
    });
}

export async function i18nActionsRead(): Promise<{}> {
    return new Promise((resolve, reject) => {
        dbModels.i18nModel.find({}, (err: any, definitions: any) => {
            if (err) { console.log("ERRI18n: ", err); reject(err); }
            resolve(definitions);
        }).catch((err: any) => {
            console.log("ERR: ", err);
        });
    });
}
