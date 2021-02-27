/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function unitDictionaryActionsRead(obj: any): Promise<typings.IUnitDictionary[]> {
    return new Promise((resolve, reject) => {
        dbModels.unitDictionaryModel.find(obj, (err: any, unitDictionary: typings.IUnitDictionary[]) => {
            if (err) { reject(err); }
            resolve(unitDictionary);
        }).lean();
    });
}
