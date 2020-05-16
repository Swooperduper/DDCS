/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function theaterModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("theater", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            lat: {
                type: String,
                required: true
            },
            lon: {
                type: String,
                required: true
            },
            zoom: {
                type: String,
                required: true
            },
            removeSideZone: {
                type: String,
                required: true
            }
        },
        {
            timestamps: true
        }
    ));
}
