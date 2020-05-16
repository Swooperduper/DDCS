/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export const weaponScoreSchema = new mongoose.Schema({
        _id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        displayName: {
            type: String
        },
        category: {
            type: String
        },
        unitType: {
            type: String
        },
        score: {
            type: Number,
            required: true,
            default: 1
        },
        tier: {
            type: Number,
            required: true,
            default: 0
        },
        fox2ModUnder2: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

/*
WeaponScoreSchema.static('findByName', function (name, callback) {
    return this.find({ name: name }, callback);
});
*/
