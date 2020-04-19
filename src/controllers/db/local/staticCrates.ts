/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {localConnection} from "../common/connection";
import {staticCrateSchema} from "./schemas";
import {ICrate} from "../../../typings";

const staticCratesTable = localConnection.model(process.env.SERVERNAME + "_crates", staticCrateSchema);

export async function staticCrateActionRead(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.find(obj).sort( { createdAt: -1 } ).exec((err, dbUnits: ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionReadStd(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.find(obj).exec((err, dbUnits: ICrate[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function staticCrateActionSave(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        const crate = new staticCratesTable(obj);
        crate.save((err, units: any) => {
            if (err) { reject(err); }
            resolve(units);
        });
    });
}

export async function staticCrateActionUpdate(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function staticCrateActionUpdateByName(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function staticCrateActionUpdateByUnitId(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function staticCrateActionChkResync(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.updateMany(
            {},
            {$set: {isResync: false}},
            (err, units) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function staticCrateActionMarkUndead(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err, units) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function staticCrateActionDelete(obj: any): Promise<ICrate[]> {
    return new Promise((resolve, reject) => {
        staticCratesTable.findByIdAndRemove(obj._id, (err, units: any) => {
            if (err) { reject(err); }
            resolve(units);
        });
    });
}

export async function staticCrateActionRemoveall(): Promise<any> {
    return staticCratesTable.deleteOne({});
}

export async function staticCrateActionDropall(obj: any): Promise<any> {
    staticCratesTable.collection.drop();
}
