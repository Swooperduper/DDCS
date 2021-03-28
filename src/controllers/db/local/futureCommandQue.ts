/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function futureCommandQueActionsGrabNextQue(obj: {
    queName: string
}): Promise<typings.ICmdQue> {
    return new Promise((resolve, reject) => {
        dbModels.futureCommandQueModel.findOneAndRemove({
            queName: obj.queName, timeToExecute: {$lt: new Date().getTime()}}, (err: any, clientQue: any) => {
            if (err) { reject(err); }
            resolve(clientQue);
        });
    });
}

export async function futureCommandQueActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const cmdque = new dbModels.futureCommandQueModel(obj);
        cmdque.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function futureCommandQueActionsDelete(obj: {
    _id: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.futureCommandQueModel.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function cmdQueActionsRemoveAll(): Promise<any> {
    return dbModels.futureCommandQueModel.deleteMany({});
}

export async function cmdQueActionsDropAll(): Promise<any> {
    return dbModels.futureCommandQueModel.collection.drop();
}
