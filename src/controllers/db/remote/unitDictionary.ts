/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {unitDictionarySchema} from "./schemas";
import {IUnitDictionary} from "../../../typings";

const unitDictionaryTable = remoteConnection.model("unitDictionaries", unitDictionarySchema);

export async function unitDictionaryActionsRead(obj: IUnitDictionary) {
    return new Promise((resolve, reject) => {
        unitDictionaryTable.find(obj, (err, unitDictionary: IUnitDictionary[]) => {
            if (err) { reject(err); }
            resolve(unitDictionary);
        });
    });
}
