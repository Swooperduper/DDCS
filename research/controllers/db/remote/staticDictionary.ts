/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {remoteConnection} from "../../../";

const staticDictionaryTable = remoteConnection.model("staticDictionaries", schemas.staticDictionarySchema);

export async function staticDictionaryActionsRead(obj: any): Promise<typings.IStaticDictionary[]> {
    return new Promise((resolve, reject) => {
        staticDictionaryTable.find(obj, (err, staticDictionary: typings.IStaticDictionary[]) => {
            if (err) { reject(err); }
            resolve(staticDictionary);
        });
    });
}
