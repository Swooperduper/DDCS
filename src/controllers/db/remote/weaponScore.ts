/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const weaponScoreTable = ddcsController.remoteConnection.model("weaponScores", ddcsController.weaponScoreSchema);

export async function weaponScoreActionsRead(obj: any): Promise<ddcsController.IWeaponDictionary[]> {
    return new Promise((resolve, reject) => {
        weaponScoreTable.find(obj, (err, weaponDictionary: ddcsController.IWeaponDictionary[]) => {
            if (err) { reject(err); }
            resolve(weaponDictionary);
        });
    });
}

export async function weaponScoreActionsReadWeapon(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        weaponScoreTable.find({_id: obj.typeName}, (err, weaponscore: ddcsController.IWeaponDictionary[]) => {
            if (err) { reject(err); }

            const firstWeaponScore = weaponscore[0];
            if (firstWeaponScore) {
                const curWeaponScore = new weaponScoreTable({
                    _id: obj.typeName,
                    name: obj.typeName,
                    displayName: obj.displayName,
                    category: obj.category,
                    unitType: obj.unitType
                });
                curWeaponScore.save((saveErr) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve();
                });
            } else {
                // console.log('curweaponscore: ', curWeaponScore);
                resolve();
            }
        });
    });
}

export async function weaponScoreActionsCheck(obj: any) {
    weaponScoreTable.find({_id: obj.typeName}, (err, weaponScore: ddcsController.IWeaponDictionary[]) => {
        if (err) {
            console.log("line:396: ", err);
        }
        if (weaponScore.length === 0) {
            const curWeaponScore = new weaponScoreTable({
                _id: obj.typeName,
                name: obj.typeName,
                unitType: obj.unitType
            });
            curWeaponScore.save((saveErr) => {
                if (saveErr) {
                    console.log("line:406: ", err);
                }
            });
        }
    });
}
