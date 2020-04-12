/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {localConnection} from "../common/connection";
import {webPushSchema} from "./schemas";
import {IWebPush} from "../../../typings";

const webPushTable = localConnection.model(process.env.SERVERNAME + "_webpush", webPushSchema);

export async function unitActionGrabNextQue(obj: any): Promise<IWebPush[]> {
    return new Promise((resolve, reject) => {
        webPushTable.findOneAndRemove({serverName: process.env.SERVERNAME}, (err, wpush: any) => {
            if(err) {
                reject(err);
            }
            resolve(wpush);
        });
    });
}

export async function unitActionSave(obj: any): Promise<IWebPush[]> {
    return new Promise((resolve, reject) => {
        const webpush = new webPushTable(obj);
        webpush.save((err, wpush: any) => {
            if (err) { reject(err); }
            resolve(wpush);
        });
    });
}

export async function unitActionDelete(obj: any): Promise<IWebPush[]> {
    return new Promise((resolve, reject) => {
        webPushTable.findByIdAndRemove(obj._id, (err, wpush: any) => {
            if (err) { reject(err); }
            resolve(wpush);
        });
    });
}

export async function unitActionRemoveall(obj: any): Promise<any> {
    return webPushTable.deleteOne({});
}

export async function unitActionDropall(obj: any): Promise<any> {
    return webPushTable.collection.drop();
}
