/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function templateRead(filter: any): Promise<typings.ITemplate[]> {
    return new Promise((resolve, reject) => {
        dbModels.templateModel.find(filter, (err: any, templates: typings.ITemplate[]) => {
            if (err) { reject(err); }
            resolve(templates);
        });
    });
}
