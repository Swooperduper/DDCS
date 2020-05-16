/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import * as constants from "../../constants";
import {remoteConnection} from "../../../";

const remoteCommsTable = remoteConnection.model("remotecomms", schemas.remoteCommsSchema);

export async function remoteCommsActionsCreate(obj: typings.IRemoteComms): Promise<void> {
    return new Promise((resolve, reject) => {
        const crComm = new remoteCommsTable(obj);
        crComm.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function remoteCommsActionsRead(obj: any): Promise<typings.IRemoteComms[]> {
    return new Promise((resolve, reject) => {
        remoteCommsTable.find(obj, (err, servers: typings.IRemoteComms[]) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function remoteCommsActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        remoteCommsTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            { upsert : true },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function remoteCommsActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        remoteCommsTable.findOneAndRemove({_id: obj._id}, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function remoteCommsActionsRemoveNonCommPeople(obj: any): Promise<void> {
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
