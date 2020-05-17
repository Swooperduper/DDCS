/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function processActionsRead(obj: any): Promise<typings.IProcess[]> {
    return new Promise((resolve, reject) => {
        dbModels.processModel.find(obj, (err: any, pQue: typings.IProcess[]) => {
            if (err) { reject(err); }
            resolve(pQue);
        });
    });
}

export async function processActionsProcessExpired(): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.processModel.deleteMany(
            { firingTime: { $lt: new Date() } },
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function processActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.processModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function processActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const processque = new dbModels.processModel(obj);
        processque.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function processActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.processModel.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function processActionsDropAll(): Promise<void> {
    await dbModels.processModel.collection.drop();
}
