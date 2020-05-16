/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {remoteConnection} from "../../../";

const unitDictionaryTable = remoteConnection.model("unitDictionaries", schemas.unitDictionarySchema);

export async function unitDictionaryActionsRead(obj: any): Promise<typings.IUnitDictionary[]> {
    return new Promise((resolve, reject) => {
        unitDictionaryTable.find(obj, (err, unitDictionary: typings.IUnitDictionary[]) => {
            if (err) { reject(err); }
            resolve(unitDictionary);
        });
    });
}
