/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const processTable = ddcsController.localConnection.model(process.env.SERVERNAME + "_processque", ddcsController.processSchema);

export async function processActionsRead(obj: any): Promise<ddcsController.IProcess[]> {
    return new Promise((resolve, reject) => {
        processTable.find(obj, (err, pQue: ddcsController.IProcess[]) => {
            if (err) { reject(err); }
            resolve(pQue);
        });
    });
}

export async function processActionsProcessExpired(): Promise<void> {
    return new Promise((resolve, reject) => {
        processTable.deleteMany(
            { firingTime: { $lt: new Date() } },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function processActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        processTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function processActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const processque = new processTable(obj);
        processque.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function processActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        processTable.findByIdAndRemove(obj._id, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function processActionsDropAll(): Promise<void> {
    await processTable.collection.drop();
}
