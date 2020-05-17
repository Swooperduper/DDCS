/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function masterQueGrabNextQue(serverName: string, obj: typings.IMasterCue): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.masterQueModel.findOneAndRemove({serverName}, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function masterQueSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = new dbModels.masterQueModel(obj);
        server.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}
