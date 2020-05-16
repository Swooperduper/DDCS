/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const webPushTable = localConnection.model(process.env.SERVERNAME + "_webpush", schemas.webPushSchema);

export async function webPushActionGrabNextQue(obj: any): Promise<typings.IWebPush[]> {
    return new Promise((resolve, reject) => {
        webPushTable.findOneAndRemove({serverName: process.env.SERVERNAME}, (err, wpush: any) => {
            if (err) {
                reject(err);
            }
            resolve(wpush);
        });
    });
}

export async function webPushActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const webpush = new webPushTable(obj);
        webpush.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function webPushActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        webPushTable.findByIdAndRemove(obj._id, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function webPushActionRemoveall(obj: any): Promise<any> {
    return webPushTable.deleteOne({});
}

export async function webPushActionDropall(obj: any): Promise<any> {
    return webPushTable.collection.drop();
}
