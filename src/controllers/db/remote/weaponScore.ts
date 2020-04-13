/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {weaponScoreSchema} from "./schemas";
import {IWeaponScore} from "../../../typings";
import * as _ from "lodash";

const weaponScoreTable = remoteConnection.model("weaponScores", weaponScoreSchema);

export async function weaponScoreActionsRead(obj: any) {
    return new Promise((resolve, reject) => {
        weaponScoreTable.find(obj, (err, weaponDictionary) => {
            if (err) { reject(err); }
            resolve(weaponDictionary);
        });
    });
}

export async function weaponScoreActionsReadWeapon(obj: any) {
    return new Promise((resolve, reject) => {
        weaponScoreTable.find({_id: obj.typeName}, (err, weaponscore) => {
            if (err) { reject(err); }
            let curWeaponScore: any;

            const firstWeaponScore = _.first(weaponscore);
            if (firstWeaponScore) {
                curWeaponScore = new weaponScoreTable({
                    _id: obj.typeName,
                    name: obj.typeName,
                    displayName: obj.displayName,
                    category: obj.category,
                    unitType: obj.unitType
                });
                curWeaponScore.save((saveErr: any, saveWeaponScore: any) => {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve(saveWeaponScore);
                });
            } else {
                // console.log('curweaponscore: ', curWeaponScore);
                resolve(firstWeaponScore);
            }
        });
    });
}

export async function weaponScoreActionsCheck(obj: any) {
    weaponScoreTable.find({_id: obj.typeName}, (err, weaponscore) => {
        if (err) {
            console.log("line:396: ", err);
        }
        if (weaponscore.length === 0) {
            const curWeaponScore = new weaponScoreTable({
                _id: obj.typeName,
                name: obj.typeName,
                unitType: obj.unitType
            });
            curWeaponScore.save((saveErr: any) => {
                if (saveErr) {
                    console.log("line:406: ", err);
                }
            });
        }
    });
}
