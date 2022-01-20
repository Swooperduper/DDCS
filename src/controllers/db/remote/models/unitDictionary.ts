/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function unitDictionaryModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("unitdictionary", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            warbondCost: {
                type: Number,
                default: 250,
                required: true
            },
            warheadName: {
                type: String,
                required: true
            },
            warbondKillMultiplier: {
                type: Number,
                default: 1.0,
                required: true
            },
            objectCategory: {
                type: Number
            },
            unitCategory: {
                type: Number,
                required: true
            },
            config: {
                type: Object
            },
            spawnCat: {
                type: String,
                required: true
            },
            spawnCatSec: {
                type: String
            },
            comboName: {
                type: Array,
                required: true
            },
            launcher: {
                type: Boolean,
                default: false
            },
            threatLvl: {
                type: Number,
                required: true,
                default: 0
            },
            reloadReqArray: {
                type: Object
            },
            enabled: {
                type: Boolean,
                default: true
            },
            lifeCost: {
                type: Number,
                default: 1
            },
            LPCost: {
                type: Number,
                default: 1
            },
            timePeriod: {
                type: Array,
                required: true
            },
            sort: {
                type: Number,
                default: 0
            },
            centerRadar: {
                type: Boolean,
                default: false
            },
            secRadarNum: {
                type: Number,
                default: 1
            },
            spokeDistance: {
                type: Number,
                default: 0.1
            },
            spoke: {
                type: Boolean,
                default: false
            },
            payload: {
                type: String
            },
            harmDetectChance: {
                type: Number,
                default: 0
            },
            natoName: {
                type: String
            },
            mobileBaseDefense: {
                type: Boolean,
                default: false
            },
            packable: {
                type: Boolean,
                default:false,
                required: true
            }
        },
        {
            timestamps: true
        }
    ));
}
