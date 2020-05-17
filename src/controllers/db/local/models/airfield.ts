/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

// Schema defines how chat messages will be stored in MongoDB
export function airfieldModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model(process.env.SERVER_NAME + "_airfield", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            baseId: {
                type: Number,
                required: true
            },
            baseType: {
                type: String,
                required: true,
                default: "MOB"
            },
            centerLoc: {
                type: [Number],
                index: "2dsphere"
            },
            logiCenter: {
                type: [Number],
                index: "2dsphere"
            },
            polygonLoc: {
                type: Object
            },
            convoyTemplate: {
                type: Object
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
            country: {
                type: String
            },
            name: {
                type: String,
                required: true
            },
            parentBase: {
                type: String
            },
            side: {
                type: Number,
                min: 0,
                max: 2,
                required: true
            },
            spawnAngle: {
                type: Number,
                min: 0,
                max: 359
            },
            spawnZones: {
                type: Object
            },
            replenTime: {
                type: Date
            },
            initSide: {
                type: Number
            },
            baseMarkId: {
                type: Number
            },
            mapType: {
                type: String,
                required: true
            },
            enabled: {
                type: Boolean,
                default: true
            },
            defaultStartSide: {
                type: Number,
                min: 0,
                max: 2,
                required: true,
                default: 0
            }
        },
        {
            timestamps: true
        }
    ));
}
