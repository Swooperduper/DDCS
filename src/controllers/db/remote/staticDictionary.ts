/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function staticDictionaryActionsRead(obj: any): Promise<typings.IStaticDictionary[]> {
    return new Promise((resolve, reject) => {
        dbModels.staticDictionaryModel.find(obj, (err: any, staticDictionary: typings.IStaticDictionary[]) => {
            if (err) { reject(err); }
            resolve(staticDictionary);
        });
    });
}
