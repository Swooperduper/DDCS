/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const serverTable = ddcsController.remoteConnection.model("servers", ddcsController.serverSchema);

export async function serverActionsCreate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = new serverTable(obj);
        server.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function serverActionsRead(obj: any): Promise<ddcsController.IServer[]> {
    return new Promise((resolve, reject) => {
        serverTable.find(obj, (err, servers: ddcsController.IServer[]) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function serverActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            {new: true},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function serverActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndRemove({name: obj.name}, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}
