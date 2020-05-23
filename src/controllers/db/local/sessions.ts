/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function sessionsActionsRead(obj: any): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        dbModels.sessionsModel.find(obj).exec((err: any, sessions: typings.ISessions[]) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsReadLatest(): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        dbModels.sessionsModel.findOne().sort({ field: "asc", createdAt: -1 }).exec((err: any, sessions: typings.ISessions[]) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsUpdate(obj: any): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        dbModels.sessionsModel.updateOne(
            {name: obj.name},
            {$set: obj},
            { upsert : true },
            (err: any, sessions: typings.ISessions[]) => {
                if (err) { reject(err); }
                resolve(sessions);
            }
        );
    });
}

export async function sessionsActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.sessionsModel.find({_id: obj._id}, (err: any, sessionsObj: typings.ISessions[]) => {
            if (err) {reject(err); }
            if (sessionsObj.length === 0) {
                const sessions = new dbModels.sessionsModel(obj);
                sessions.save((saveErr: any) => {
                    if (saveErr) {reject(saveErr); }
                    resolve();
                });
            }
        });
    });
}
