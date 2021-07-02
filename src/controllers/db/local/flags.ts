/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 * await ddcsControllers.flagsActionRead({_id:"2000"}) ~ Reads _id 2000 and returns full row
 * await ddcsControllers.flagsActionUpdate({_id:"2000", value : 1000}); ~ Updates _id 2000 and with value of 1000
 *
*/
import * as _ from "lodash";
import * as typings from "../../../typings";
import { dbModels } from "../common";
import * as ddcsController from "../../";

export async function flagsActionRead(obj: any): Promise<typings.IFlags[]> {
    return new Promise((resolve, reject) => {
        if (obj) {
            dbModels.flagsModel.find(obj, (err: any, dbFlags: Promise<typings.IFlags[]>) => {
            if (err) { reject(err); }
                resolve(dbFlags);
            });
        } else {
            resolve([]);
        }
    });
}


export async function flagsActionReadStd(obj: any): Promise<typings.IFlags[]> {
    return new Promise((resolve, reject) => {
        dbModels.flagsModel.find(obj).exec((err: any, dbFlags: typings.IFlags[]) => {
            if (err) { reject(err); }
            resolve(dbFlags);
        });
    });
}

export async function flagsActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.flagsModel.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function flagsActionRemoveall(): Promise<any> {
    return dbModels.flagsModel.deleteOne({});
}

export async function flagsActionDropall(obj: any): Promise<any> {
    return dbModels.flagsModel.collection.drop();
}
