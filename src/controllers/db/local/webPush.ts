/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function webPushActionGrabNextQue(obj: any): Promise<typings.IWebPush[]> {
    return new Promise((resolve, reject) => {
        dbModels.webPushModel.findOneAndRemove({serverName: process.env.SERVERNAME}, (err: any, wpush: any) => {
            if (err) {
                reject(err);
            }
            resolve(wpush);
        });
    });
}

export async function webPushActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const webpush = new dbModels.webPushModel(obj);
        webpush.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function webPushActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.webPushModel.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function webPushActionRemoveall(obj: any): Promise<any> {
    return dbModels.webPushModel.deleteOne({});
}

export async function webPushActionDropall(obj: any): Promise<any> {
    return dbModels.webPushModel.collection.drop();
}
