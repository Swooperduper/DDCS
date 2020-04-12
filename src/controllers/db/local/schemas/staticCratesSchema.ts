/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export const staticCrateSchema = new mongoose.Schema({
        _id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        lonLatLoc: {
            type: [Number],
            index: "2dsphere"
        },
        shapeName: {
            type: String,
            default: "iso_container_small_cargo"
        },
        category: {
            type: String,
            default: "Cargo"
        },
        type: {
            type: String,
            default: "iso_container_small"
        },
        heading: {
            type: Number,
            min: 0,
            max: 359,
            required: true
        },
        canCargo: {
            type: Boolean,
            default: true
        },
        mass: {
            type: Number,
            default: 100
        },
        playerOwnerId: {
            type: String,
            required: true
        },
        templateName: {
            type: String
        },
        special: {
            type: String
        },
        crateAmt: {
            type: Number,
        },
        isCombo: {
            type: Boolean,
            default: false
        },
        playerCanDrive: {
            type: Boolean,
            default: true
        },
        country: {
            type: String,
            required: true
        },
        side: {
            type: String,
            required: true
        },
        coalition: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);
