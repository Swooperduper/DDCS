/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../../../start";


export async function serverActionsCreate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = new dbModels.serverModel(obj);
        server.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function serverActionsRead(obj: any): Promise<typings.IServer[]> {
    return new Promise((resolve, reject) => {
        dbModels.serverModel.find(obj, (err: any, servers: typings.IServer[]) => {
            if (err) { reject(err); }
            resolve(servers);
        }).catch((err: any) => {
            console.log("ERR: ", err);
        });
    });
}

export async function serverActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.serverModel.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            {new: true},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        )
            .catch((err: any) => {
                console.log("ERR: ", err);
            });
    });
}

export async function serverActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.serverModel.findOneAndRemove({name: obj.name}, (err: any) => {
            if (err) { reject(err); }
            resolve();
        })
            .catch((err: any) => {
                console.log("ERR: ", err);
            });
    });
}
