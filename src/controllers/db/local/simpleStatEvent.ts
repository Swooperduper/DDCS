/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function simpleStatEventActionsRead(obj: {
    sessionName: string
}): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        dbModels.simpleStatEventModel.find({
            sessionName: obj.sessionName,
            showInChart: true},
            (err: any, simpleStatEvent: typings.ISimpleStatEvents[]) => {
                        if (err) { reject(err); }
                        resolve(simpleStatEvent);
                    }
        );
    });
}
export async function simpleStatEventActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function simpleStatEventActionsReadAll(): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        dbModels.simpleStatEventModel.find((err: any, simpleStatEvent: typings.ISimpleStatEvents[]) => {
            if (err) { reject(err); }
            resolve(simpleStatEvent);
        });
    });
}

export async function simpleStatEventActionsSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const simplestatevent = new dbModels.simpleStatEventModel(obj);
        simplestatevent.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}


export async function simpleStatEventActionsReadDisconnectsInLastSeconds(obj: {
    sessionName: string,
    secondsAgo: number
}): Promise<typings.ISimpleStatEvents[]> {
    return new Promise((resolve, reject) => {
        dbModels.simpleStatEventModel.find({
            msg: /disconnected/,
            showInChart: true,
            updatedAt:{ $gt : new Date(new Date().getTime() - (obj.secondsAgo * 1000)) }},
            (err: any, simpleStatEvent: typings.ISimpleStatEvents[]) => {
                        if (err) { reject(err); }
                        resolve(simpleStatEvent);
                    }
        );
    });
}