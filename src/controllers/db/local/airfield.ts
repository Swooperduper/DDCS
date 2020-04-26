/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as _ from "lodash";
import * as ddcsController from "../../";
import {IServer} from "../../";

const airfieldTable = ddcsController.localConnection.model(process.env.SERVERNAME + "_airfield", ddcsController.airfieldSchema);
const curTheater = ddcsController.config.theater;

export async function baseActionRead(obj: any): Promise<ddcsController.IBase[]> {
    return new Promise( async (resolve, reject) => {
        await airfieldTable.find(obj, (err, dbairfields: Promise<ddcsController.IBase[]>) => {
            if (err) { reject(err); }
            resolve(dbairfields);
        });
    });
}

export async function baseActionUpdate(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
}

export async function baseActionGetClosestBase(obj: { unitLonLatLoc: number[] }): Promise<ddcsController.IBase> {
    return new Promise((resolve, reject) => {
        airfieldTable.find(
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
                mapType: curTheater
            },
            (err, dbAirfields: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbAirfields[0]);
            }
        );
    });
}

export async function baseActionGetClosestFriendlyBase(obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<ddcsController.IBase> {
    return new Promise((resolve, reject) => {
        airfieldTable.find(
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
                mapType: curTheater
            },
            (err, dbairfields: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbairfields[0]);
            }
        );
    });
}

export async function baseActionGetClosestEnemyBase(obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<ddcsController.IBase> {
    return new Promise((resolve, reject) => {
        airfieldTable.find(
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
                mapType: curTheater
            },
            (err, dbairfields: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(dbairfields[0]);
            }
        );
    });
}

export async function baseActionGetBaseSides(): Promise<ddcsController.IBase[]> {
    return new Promise((resolve, reject) => {
        if (!curTheater) {
            ddcsController.getServer()
                .then((serverConf) => {
                    airfieldTable.find(
                        {mapType: serverConf.theater, enabled: true},
                        (err, dbAirfields: ddcsController.IBase[]) => {
                            if (err) { reject(err); }
                            resolve(_.transform(dbAirfields, (result: any, value: any) => {
                                result.push({name: value.name, baseType: value.baseType, side: value.side});
                            }, []));
                        }
                    );
                })
                .catch((err) => {
                    reject("line:542, failed to connect to db: " + JSON.stringify(err));
                })
            ;
        } else {
            airfieldTable.find(
                {mapType: curTheater, enabled: true},
                (err, dbAirfields: ddcsController.IBase[]) => {
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
}): Promise<ddcsController.IBase[]> {
    return new Promise((resolve, reject) => {
        airfieldTable.updateMany(
            {_id: new RegExp(obj.name)},
            {$set: {side: obj.side, replenTime: new Date()}},
            (err, airfields: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfields);
            }
        );
    });
}

export async function baseActionUpdateSpawnZones(obj: {
    name: string,
    spawnZones: object
}): Promise<ddcsController.IBase[]> {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj.name},
            {$set: {spawnZones: obj.spawnZones}},
            (err, airfield: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
}

export async function baseActionUpdateReplenTimer(obj: {
    name: string,
    replenTime: number
}): Promise<ddcsController.IBase[]> {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj.name},
            {$set: {replenTime: obj.replenTime}},
            (err, airfield: ddcsController.IBase[]) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
}

export async function baseActionSave(obj: {
    _id: string,
    side: number
}): Promise<void> {
    return new Promise((resolve, reject) => {
        airfieldTable.find({_id: obj._id}, (findErr, airfieldObj: ddcsController.IBase[]) => {
            if (findErr) { reject(findErr); }
            if (airfieldObj.length === 0) {
                const aObj = new airfieldTable(obj);
                aObj.save((err) => {
                    if (err) { reject(err); }
                    resolve();
                });
            } else {
                airfieldTable.updateOne(
                    {_id: obj._id},
                    {$set: {side: obj.side}},
                    (err) => {
                        if (err) { reject(err); }
                        resolve();
                    }
                );
            }
        });
    });
}
