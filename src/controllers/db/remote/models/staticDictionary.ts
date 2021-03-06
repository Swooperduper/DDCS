/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function staticDictionaryModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("staticdictionary", new mongoose.Schema({
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
            objectCategory: {
                type: Number
            },
            unitCategory: {
                type: Number
            },
            canCargo: {
                type: Boolean,
                default: false
            },
            config: {
                type: Object
            }
        },
        {
            timestamps: true
        }
    ));
}
