/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {serverSchema} from "./schemas";

const serverTable = remoteConnection.model("servers", serverSchema);

export async function serverActionsCreate(obj: any) {
    return new Promise((resolve, reject) => {
        const server = new serverTable(obj);
        server.save((err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function serverActionsRead(obj: any) {
    return new Promise((resolve, reject) => {
        serverTable.find(obj, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function serverActionsUpdate(obj: any) {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            {new: true},
            (err, servers) => {
                if (err) { reject(err); }
                resolve(servers);
            }
        );
    });
}

export async function serverActionsDelete(obj: any) {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndRemove({name: obj.name}, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}
