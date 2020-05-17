/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as typings from "../../../typings";
import { dbModels } from "../common";

export async function staticCrateActionRead(obj: any): Promise<typings.ICrate[]> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.find(obj).sort( { createdAt: -1 } ).exec((err: any, dbUnits: typings.ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionReadStd(obj: any): Promise<typings.ICrate[]> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.find(obj).exec((err: any, dbUnits: typings.ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const crate = new dbModels.staticCratesTable(obj);
        crate.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function staticCrateActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionUpdateByName(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionUpdateByUnitId(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionChkResync(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.updateMany(
            {},
            {$set: {isResync: false}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionMarkUndead(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.staticCratesTable.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function staticCrateActionRemoveall(): Promise<any> {
    return dbModels.staticCratesTable.deleteOne({});
}

export async function staticCrateActionDropall(obj: any): Promise<any> {
    return dbModels.staticCratesTable.collection.drop();
}
