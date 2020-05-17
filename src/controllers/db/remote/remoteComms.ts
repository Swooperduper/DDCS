/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import * as constants from "../../constants";
import { dbModels } from "../common";

export async function remoteCommsActionsCreate(obj: typings.IRemoteComms): Promise<void> {
    return new Promise((resolve, reject) => {
        const crComm = new dbModels.remoteCommsModel(obj);
        crComm.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function remoteCommsActionsRead(obj: any): Promise<typings.IRemoteComms[]> {
    return new Promise((resolve, reject) => {
        dbModels.remoteCommsModel.find(obj, (err: any, servers: typings.IRemoteComms[]) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
}

export async function remoteCommsActionsUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.remoteCommsModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            { upsert : true },
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function remoteCommsActionsDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.remoteCommsModel.findOneAndRemove({_id: obj._id}, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function remoteCommsActionsRemoveNonCommPeople(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.remoteCommsModel.deleteMany(
            {
                updatedAt: {
                    $lte: new Date(new Date().getTime() - constants.time.twoMinutes)
                }
            },
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}
