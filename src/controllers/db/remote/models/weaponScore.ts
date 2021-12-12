/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function weaponScoreModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("weaponscore", new mongoose.Schema({
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
            warBondCost: {
                type: Number,
                default: 250
            },
            warBondKillMultiplier: {
                type: Number,
                default: 1.0
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
            },
            isAntiRadiation: {
                type: Boolean,
                default: false
            }
        },
        {
            timestamps: true
        }
    ));
}
