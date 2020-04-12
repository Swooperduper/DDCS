import * as constants from "../../constants";
import {localConnection} from "../common/connection";
import {airfieldSchema} from "./schemas";
import {IBase} from "../../../typings";

const airfieldTable = localConnection.model(process.env.SERVERNAME + "_airfield", airfieldSchema);
const curTheater = constants.config.theater;

export const baseActionRead = (obj: any): Promise<IBase[]> => {
    return new Promise( async (resolve, reject) => {
        await airfieldTable.find(obj, (err: any, dbairfields: Promise<IBase[]>) => {
            if (err) { reject(err); }
            resolve(dbairfields);
        });
    });
};

export const baseActionUpdate = (obj: {
    _id: string
}): Promise<IBase[]> => {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err: any, serObj: Promise<IBase[]>) => {
                if (err) { reject(err); }
                resolve(serObj);
            }
        );
    });
};

export const baseActionGetClosestBase = (obj: {
    unitLonLatLoc: number[]
}): Promise<IBase> => {
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
            (err, dbairfields) => {
                if (err) { reject(err); }
                resolve(_.first(dbairfields));
            }
        );
    });
};

export const baseActionGetClosestFriendlyBase = (obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<IBase> => {
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
            (err, dbairfields) => {
                if (err) { reject(err); }
                resolve(_.first(dbairfields));
            }
        );
    });
};

export const baseActionGetClosestEnemyBase = (obj: {
    playerSide: number,
    unitLonLatLoc: number[]
}): Promise<IBase> => {
    return new Promise((resolve, reject) => {
        airfieldTable.find(
            {
                baseType: "MOB",
                enabled: true,
                side: constants.enemyCountry[obj.playerSide],
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
            (err, dbairfields) => {
                if (err) { reject(err); }
                resolve(_.first(dbairfields));
            }
        );
    });
};

export const baseActionGetBaseSides = (serverName: string): Promise<IBase[]> => {
    return new Promise((resolve, reject) => {
        if (!curTheater) {
            constants.getServer(serverName)
                .then((serverConf: any) => {
                    airfieldTable.find(
                        {mapType: serverConf.theater, enabled: true},
                        (err, dbairfields) => {
                            if (err) { reject(err); }
                            resolve(_.transform(dbairfields, (result: any, value: any) => {
                                result.push({name: value.name, baseType: value.baseType, side: value.side});
                            }, []));
                        }
                    );
                })
                .catch((err: any) => {
                    reject("line:542, failed to connect to db: ");
                })
            ;
        } else {
            airfieldTable.find(
                {mapType: curTheater, enabled: true},
                (err, dbairfields) => {
                    if (err) { reject(err); }
                    resolve(_.transform(dbairfields, (result: any, value: any) => {
                        result.push({name: value.name, baseType: value.baseType, side: value.side});
                    }));
                }
            );
        }
    });
};

export const baseActionUpdateSide = (obj: {
    name: string,
    side: number
}): Promise<IBase[]> => {
    return new Promise((resolve, reject) => {
        airfieldTable.updateMany(
            {_id: new RegExp(obj.name)},
            {$set: {side: obj.side, replenTime: new Date()}},
            (err, airfields) => {
                if (err) { reject(err); }
                resolve(airfields);
            }
        );
    });
};

export const baseActionUpdateSpawnZones = (obj: {
    name: string,
    spawnZones: object
}): Promise<IBase> => {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj.name},
            {$set: {spawnZones: obj.spawnZones}},
            (err, airfield) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
};

export const baseActionUpdateReplenTimer = (obj: {
    name: string,
    replenTime: number
}): Promise<IBase> => {
    return new Promise((resolve, reject) => {
        airfieldTable.updateOne(
            {_id: obj.name},
            {$set: {replenTime: obj.replenTime}},
            (err, airfield) => {
                if (err) { reject(err); }
                resolve(airfield);
            }
        );
    });
};

export const baseActionSave = (obj: {
    _id: string,
    side: number
}) => {
    return new Promise((resolve, reject) => {
        airfieldTable.find({_id: obj._id}, (findErr, airfieldObj) => {
            if (findErr) { reject(findErr); }
            if (airfieldObj.length === 0) {
                const aObj = new airfieldTable(obj);
                aObj.save((err, afObj) => {
                    if (err) { reject(err); }
                    resolve(afObj);
                });
            } else {
                airfieldTable.updateOne(
                    {_id: obj._id},
                    {$set: {side: obj.side}},
                    (err, airfield) => {
                        if (err) { reject(err); }
                        resolve(airfield);
                    }
                );
            }
        });
    });
};
