/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

// Schema defines how chat messages will be stored in MongoDB
export function unitModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("unit", new mongoose.Schema({
            _id: String,
            name: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            },
            coalition: {
                type: Number,
                min: 1,
                max: 2,
                required: true
            },
            unitCategory: {
                type: Number,
                required: true
            },
            objectCategory: {
                type: Number
            },
            country: {
                type: Number,
                required: true
            },
            alt: {
                type: Number,
                required: true
            },
            hdg: {
                type: Number,
                min: 0,
                max: 359,
                required: true
            },
            unitId: {
                type: Number
            },
            groupId: {
                type: Number
            },
            lonLatLoc: {
                type: [Number],
                index: "2dsphere"
            },
            agl: {
                type: Number
            },
            isActive: {
                type: Boolean,
                default: true
            },
            life: {
                type: Number
            },
            maxLife: {
                type: Number
            },
            speed: {
                type: Number
            },
            playerCanDrive: {
                type: Boolean,
                default: false
            },
            groupName: {
                type: String,
                require: true
            },
            playername: {
                type: String
            },
            playerOwnerId: {
                type: String
            },
            hidden: {
                type: Boolean,
                default: false
            },
            enabled: {
                type: Boolean,
                default: true
            },
            dead: {
                type: Boolean,
                default: false
            },
            proxChkGrp: {
                type: String
            },
            jtacTarget: {
                type: String
            },
            jtacReplenTime: {
                type: Date
            },
            inAir: {
                type: Boolean
            },
            isTroop: {
                type: Boolean,
                default: false
            },
            isCrate: {
                type: Boolean,
                default: false
            },
            isCombo: {
                type: Boolean,
                default: false
            },
            isResync: {
                type: Boolean,
                default: false
            },
            isAI: {
                type: Boolean,
                default: false
            },
            troopType: {
                type: String
            },
            virtCrateType: {
                type: String
            },
            intCargoType: {
                type: String
            },
            spawnCat: {
                type: String
            },
            ammo: {
                type: Array
            },
            markId: {
                type: Number
            },
            surfType: {
                type: Number
            },
            shape_name: {
                type: String
            },
            crateAmt: {
                type: Number,
                default: 1
            },
            templateName: {
                type: String
            }
        },
        {
            timestamps: true
        }
    ));
}
