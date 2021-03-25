/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as typings from "../../../typings";
import { dbModels } from "../common";
import * as ddcsControllers from "../../";

export async function actionAliveNames(obj: any): Promise<any> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.find(obj).select({_id: 1}).setOptions({ lean: true }).exec((err: any, unitNames: any) => {
            if (err) { reject(err); }
            resolve(unitNames);
        });
    });
}

export async function actionCount(obj: any): Promise<number> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.countDocuments(obj, (err: any, count: number) => {
            if (err) { reject(err); }
            resolve(count);
        });
    });
}

export async function unitActionRead(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.find(obj).sort( { createdAt: -1 } ).lean().exec((err: any, dbUnits: typings.IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadFirst5(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.find(obj).sort( { createdAt: -1 } ).limit(5).exec((err: any, dbUnits: typings.IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadStd(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.find(obj).exec((err: any, dbUnits: typings.IUnit[]) => {
            if (err) { reject(err); }
            resolve(dbUnits);
        });
    });
}

export async function unitActionReadMin(obj: any): Promise<typings.IUnit[]> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.find(obj).exec((err: any, dbUnits: typings.IUnit[]) => {
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
        const unit = new dbModels.unitModel(obj);
        unit.save((err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function unitActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.findOneAndUpdate(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionUpdateByName(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionUpdateByUnitId(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.findOneAndUpdate(
            {unitId: obj.unitId},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionChkResync(): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.updateMany(
            {},
            {$set: {isResync: false}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionChkResyncActive(): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.updateMany(
            {isActive: false, _id: {$not: /~/}},
            {$set: {isResync: false}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionMarkUndead(): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.unitModel.updateMany(
            {isResync: false},
            {$set: {dead: true}},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionRemoveAllDead(): Promise<void> {
    return new Promise((resolve, reject) => {
        const fiveMinsAgo = new Date(new Date()).getTime() - ddcsControllers.time.fiveMins;
        // console.log('five mins: ', fiveMinsAgo);
        const catNum = ddcsControllers.UNIT_CATEGORY.indexOf("STRUCTURE");
        dbModels.unitModel.deleteOne(
            {
                dead: true,
                unitCategory: {
                    $ne: catNum
                },
                updatedAt: {
                    $lte: fiveMinsAgo
                }
            },
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function unitActionDelete(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("UAD: ", obj._id);
        dbModels.unitModel.findByIdAndRemove(obj._id, (err: any) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function unitActionRemoveall(): Promise<void> {
    return dbModels.unitModel.deleteMany({});
}

export async function unitActionDropall(): Promise<void> {
    return dbModels.unitModel.collection.drop();
}

