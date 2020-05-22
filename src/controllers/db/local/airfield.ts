/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as types from "../../../typings";
import { dbModels } from "../common";
import * as ddcsController from "../../";

export async function baseActionRead(obj: any): Promise<types.IBase[]> {
    return new Promise( async (resolve, reject) => {
        await dbModels.airfieldModel.find(obj, (err: any, dbairfields: Promise<types.IBase[]>) => {
            if (err) { reject(err); }
            resolve(dbairfields);
        });
    });
}

export async function baseActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function baseActionGetClosestBase(obj: { unitLonLatLoc: number[] }): Promise<types.IBase> {

    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.find(
            {
                baseType: "MOB",
                enabled: true,
                centerLoc: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: obj.unitLonLatLoc
                        }
                    }
                },
                mapType: engineCache.config.theater
            },
            (err: any, dbAirfields: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbAirfields[0]);
            }
        );
    });
}

export async function baseActionGetClosestFriendlyBase(obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<types.IBase> {

    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.find(
            {
                baseType: "MOB",
                enabled: true,
                side: obj.playerSide,
                centerLoc: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: obj.unitLonLatLoc
                        }
                    }
                },
                mapType: engineCache.config.theater
            },
            (err: any, dbairfields: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbairfields[0]);
            }
        );
    });
}

export async function baseActionGetClosestEnemyBase(obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<types.IBase> {

    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.find(
            {
                baseType: "MOB",
                enabled: true,
                side: ddcsController.enemyCountry[obj.playerSide],
                centerLoc: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: obj.unitLonLatLoc
                        }
                    }
                },
                mapType: engineCache.config.theater
            },
            (err: any, dbairfields: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbairfields[0]);
            }
        );
    });
}

export async function baseActionGetBaseSides(): Promise<types.IBase[]> {

    const engineCache = ddcsController.getEngineCache();
    return new Promise((resolve, reject) => {
        if (!engineCache.config.theater) {
            dbModels.airfieldModel.find(
                {mapType: engineCache.config.theater, enabled: true},
                (err: any, dbAirfields: types.IBase[]) => {
                    if (err) { reject(err); }
                    resolve(_.transform(dbAirfields, (result: any, value: any) => {
                        result.push({name: value.name, baseType: value.baseType, side: value.side});
                    }, []));
                }
            );
        } else {
            dbModels.airfieldModel.find(
                {mapType: engineCache.config.theater, enabled: true},
                (err: any, dbAirfields: types.IBase[]) => {
                    if (err) { reject(err); }
                    resolve(_.transform(dbAirfields, (result: any, value: any) => {
                        result.push({name: value.name, baseType: value.baseType, side: value.side});
                    }));
                }
            );
        }
    });
}

export async function baseActionUpdateSide(obj: {
    name: string,
    side: number
}): Promise<types.IBase[]> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.updateMany(
            {_id: new RegExp(obj.name)},
            {$set: {side: obj.side, replenTime: new Date()}},
            (err: any, airfields: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfields);
            }
        );
    });
}

export async function baseActionUpdateSpawnZones(obj: {
    name: string,
    spawnZones: object
}): Promise<types.IBase[]> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.updateOne(
            {_id: obj.name},
            {$set: {spawnZones: obj.spawnZones}},
            (err: any, airfield: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
}

export async function baseActionUpdateReplenTimer(obj: {
    name: string,
    replenTime: number
}): Promise<types.IBase[]> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.updateOne(
            {_id: obj.name},
            {$set: {replenTime: obj.replenTime}},
            (err: any, airfield: types.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
}

export async function baseActionSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        dbModels.airfieldModel.find({_id: obj._id}, (findErr: any, airfieldObj: types.IBase[]) => {
            if (findErr) { reject(findErr); }
            if (airfieldObj.length === 0) {
                const aObj = new dbModels.airfieldModel(obj);
                aObj.save((err: any) => {
                    if (err) { reject(err); }
                    resolve();
                });
            } else {
                dbModels.airfieldModel.updateOne(
                    {_id: obj._id},
                    {$set: {side: obj.side}},
                    (err: any) => {
                        if (err) { reject(err); }
                        resolve();
                    }
                );
            }
        });
    });
}
