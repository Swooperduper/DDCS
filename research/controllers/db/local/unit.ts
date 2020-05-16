/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as schemas from "./schemas";
import * as typings from "../../../typings";
import * as constants from "../../constants";
import {localConnection} from "../../../";

const unitTable = localConnection.model(process.env.SERVERNAME + "_unit", schemas.unitSchema);

export async function unitActionRead(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).sort( { createdAt: -1 } ).exec((err, dbUnits: typings.IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadStd(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).exec((err, dbUnits: typings.IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadMin(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).exec((err, dbUnits: typings.IUnit[]) => {
            const curDbUnits: any[] = [];
            if (err) { reject(err); }
            _.forEach(dbUnits, (unit) => {
                const pickArray = [
                    "_id",
                    "lonLatLoc",
                    "alt",
                    "hdg",
                    "speed",
                    "coalition",
                    "type",
                    "playername",
                    "playerOwnerId"
                ];
                curDbUnits.push(_.pick(unit, pickArray));
            });
            resolve(curDbUnits);
        });
    });
}

export async function unitActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const unit = new unitTable(obj);
        unit.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function unitActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionUpdateByName(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionUpdateByUnitId(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionChkResync(): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.updateMany(
            {},
            {$set: {isResync: false}},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionMarkUndead(): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionRemoveAllDead(): Promise<void> {
    return new Promise((resolve, reject) => {
        const fiveMinsAgo = new Date(new Date()).getTime() - constants.time.fiveMins;
        // console.log('five mins: ', fiveMinsAgo);
        unitTable.deleteOne(
            {
                dead: true,
                category: {
                    $ne: "STRUCTURE"
                },
                updatedAt: {
                    $lte: fiveMinsAgo
                }
            },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        unitTable.findByIdAndRemove(obj._id, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function unitActionRemoveall(): Promise<any> {
    return unitTable.deleteOne({});
}

export async function unitActionDropall(): Promise<any> {
    return unitTable.collection.drop();
}

