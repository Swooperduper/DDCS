/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const cmdQueTable = ddcsController.localConnection.model(process.env.SERVERNAME + "_cmdque", ddcsController.cmdQueSchema);

export async function cmdQueActionsGrabNextQue(obj: {
    queName: string
}): Promise<ddcsController.ICmdQue> {
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
