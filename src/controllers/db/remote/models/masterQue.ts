/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function masterQueModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("masterque", new mongoose.Schema({
        payload: {
            type: Object,
            required: true
        },
        serverName: {
            type: String,
            required: true
        },
        side: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        }
    }, {
        timestamps: true
    }));
}
