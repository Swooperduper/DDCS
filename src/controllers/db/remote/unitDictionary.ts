/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const unitDictionaryTable = ddcsController.remoteConnection.model("unitDictionaries", ddcsController.unitDictionarySchema);

export async function unitDictionaryActionsRead(obj: any): Promise<ddcsController.IUnitDictionary[]> {
    return new Promise((resolve, reject) => {
        unitDictionaryTable.find(obj, (err, unitDictionary: ddcsController.IUnitDictionary[]) => {
            if (err) { reject(err); }
            resolve(unitDictionary);
        });
    });
}
