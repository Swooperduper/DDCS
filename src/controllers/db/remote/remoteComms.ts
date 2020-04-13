/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {remoteCommsSchema} from "./schemas";
import {IRemoteComms} from "../../../typings";

const remoteCommsTable = remoteConnection.model("remotecomms", remoteCommsSchema);

export async function remoteCommsActionsCreate(obj: IRemoteComms) {
    return new Promise((resolve, reject) => {
        const crComm = new remoteCommsTable(obj);
        crComm.save((err, servers: any) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function remoteCommsActionsRead(obj: IRemoteComms) {
    return new Promise((resolve, reject) => {
        remoteCommsTable.find(obj, (err, servers: any) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function remoteCommsActionsUpdate(obj: IRemoteComms) {
    return new Promise((resolve, reject) => {
        remoteCommsTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            { upsert : true },
            (err, servers: any) => {
                if (err) { reject(err); }
                resolve(servers);
            }
        );
    });
}

export async function remoteCommsActionsDelete(obj: IRemoteComms) {
    return new Promise((resolve, reject) => {
        remoteCommsTable.findOneAndRemove({_id: obj._id}, (err, servers: any) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function remoteCommsActionsRemoveNonCommPeople(obj: IRemoteComms) {
    return new Promise((resolve, reject) => {
        remoteCommsTable.deleteMany(
            {
                updatedAt: {
                    $lte: new Date(new Date().getTime() - constants.time.twoMinutes)
                }
            },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}
