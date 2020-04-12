/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as constants from "../../constants";
import {localConnection} from "../common/connection";
import {unitSchema} from "./schemas";
import {IUnit} from "../../../typings";

const unitTable = localConnection.model(process.env.SERVERNAME + "_unit", unitSchema);

export async function unitActionRead(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).sort( { createdAt: -1 } ).exec((err, dbUnits: IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadStd(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).exec((err, dbUnits: IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadMin(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.find(obj).exec((err, dbUnits) => {
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

export async function unitActionSave(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        const unit = new unitTable(obj);
        unit.save((err, units: any) => {
            if (err) { reject(err); }
            resolve(units);
        });
    });
}

export async function unitActionUpdate(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function unitActionUpdateByName(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function unitActionUpdateByUnitId(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err, units: any) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function unitActionChkResync(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.updateMany(
            {},
            {$set: {isResync: false}},
            (err, units) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function unitActionMarkUndead(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err, units) => {
                if (err) { reject(err); }
                resolve(units);
            }
        );
    });
}

export async function unitActionRemoveAllDead(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        const fiveMinsAgo = new Date(new Date()).getTime() - _.get(constants, "time.fiveMins");
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

export async function unitActionDelete(obj: any): Promise<IUnit[]> {
    return new Promise((resolve, reject) => {
        unitTable.findByIdAndRemove(obj._id, (err, units: any) => {
            if (err) { reject(err); }
            resolve(units);
        });
    });
}

export async function unitActionRemoveall(obj: any): Promise<any> {
    return unitTable.deleteOne({});
}

export async function unitActionDropall(obj: any): Promise<any> {
    return unitTable.collection.drop();
}

