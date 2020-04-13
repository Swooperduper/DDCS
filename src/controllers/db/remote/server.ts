/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {serverSchema} from "./schemas";
import {IServer} from "../../../typings";

const serverTable = remoteConnection.model("servers", serverSchema);

export async function serverActionsCreate(obj: IServer) {
    return new Promise((resolve, reject) => {
        const server = new serverTable(obj);
        server.save((err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function serverActionsRead(obj: IServer) {
    return new Promise((resolve, reject) => {
        serverTable.find(obj, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function serverActionsUpdate(obj: IServer) {
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

export async function serverActionsDelete(obj: IServer) {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndRemove({name: obj.name}, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}
