/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {localConnection} from "../../../";

const staticCratesTable = localConnection.model(process.env.SERVERNAME + "_crates", schemas.staticCrateSchema);

export async function staticCrateActionRead(obj: any): Promise<typings.ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.find(obj).sort( { createdAt: -1 } ).exec((err, dbUnits: typings.ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionReadStd(obj: any): Promise<typings.ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.find(obj).exec((err, dbUnits: typings.ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const crate = new staticCratesTable(obj);
        crate.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function staticCrateActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionUpdateByName(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionUpdateByUnitId(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionChkResync(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.updateMany(
            {},
            {$set: {isResync: false}},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionMarkUndead(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function staticCrateActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findByIdAndRemove(obj._id, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function staticCrateActionRemoveall(): Promise<any> {
    return staticCratesTable.deleteOne({});
}

export async function staticCrateActionDropall(obj: any): Promise<any> {
    return staticCratesTable.collection.drop();
}
