/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const staticDictionaryTable = ddcsController.remoteConnection.model("staticDictionaries", ddcsController.staticDictionarySchema);

export async function staticDictionaryActionsRead(obj: any): Promise<ddcsController.IStaticDictionary[]> {
    return new Promise((resolve, reject) => {
        staticDictionaryTable.find(obj, (err, staticDictionary: ddcsController.IStaticDictionary[]) => {
            if (err) { reject(err); }
            resolve(staticDictionary);
        });
    });
}
