/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const sessionsTable = localConnection.model(process.env.SERVER_NAME + "_sessions", schemas.sessionsSchema);

export async function sessionsActionsRead(obj: any): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        sessionsTable.find(obj).exec((err, sessions: typings.ISessions[]) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsReadLatest(): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        sessionsTable.findOne().sort({ field: "asc", createdAt: -1 }).limit(1).exec((err, sessions: typings.ISessions[]) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsUpdate(obj: any): Promise<typings.ISessions[]> {
    return new Promise((resolve, reject) => {
        sessionsTable.updateOne(
            {name: obj.name},
            {$set: obj},
            { upsert : true },
            (err, sessions: typings.ISessions[]) => {
                if (err) { reject(err); }
                resolve(sessions);
            }
        );
    });
}

export async function sessionsActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        sessionsTable.find({_id: obj._id}, (err, sessionsObj: typings.ISessions[]) => {
            if (err) {reject(err); }
            if (sessionsObj.length === 0) {
                const sessions = new sessionsTable(obj);
                sessions.save((saveErr) => {
                    if (saveErr) {reject(saveErr); }
                    resolve();
                });
            }
        });
    });
}
