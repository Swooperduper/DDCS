/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const cmdQueTable = localConnection.model(process.env.SERVER_NAME + "_cmdque", schemas.cmdQueSchema);

export async function cmdQueActionsGrabNextQue(obj: {
    queName: string
}): Promise<typings.ICmdQue> {
    return new Promise((resolve, reject) => {
        cmdQueTable.findOneAndRemove({queName: obj.queName, timeToExecute: {$lt: new Date().getTime()}}, (err, clientQue: any) => {
            if (err) { reject(err); }
            resolve(clientQue);
        });
    });
}

export async function cmdQueActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const cmdque = new cmdQueTable(obj);
        cmdque.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function cmdQueActionsDelete(obj: {
    _id: string
}): Promise<void> {
    return new Promise((resolve, reject) => {
        cmdQueTable.findByIdAndRemove(obj._id, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function cmdQueActionsRemoveAll(): Promise<any> {
    return cmdQueTable.deleteMany({});
}

export async function cmdQueActionsDropAll(): Promise<any> {
    return cmdQueTable.collection.drop();
}
