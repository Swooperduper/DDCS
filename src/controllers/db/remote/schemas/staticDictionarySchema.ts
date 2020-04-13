/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export const staticDictionarySchema = new mongoose.Schema({
        _id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        country: {
            type: Array,
            required: true
        },
        shape_name: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        canCargo: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);
