/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {staticDictionarySchema} from "./schemas";
import {IStaticDictionary} from "../../../typings";

const staticDictionaryTable = remoteConnection.model("staticDictionaries", staticDictionarySchema);

export async function staticDictionaryActionsRead(obj: IStaticDictionary) {
    return new Promise((resolve, reject) => {
        staticDictionaryTable.find(obj, (err, staticDictionary: IStaticDictionary[]) => {
            if (err) { reject(err); }
            resolve(staticDictionary);
        });
    });
}
