/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function templateModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("template", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            template: {
                type: String,
                required: true
            },
            type: {
                type: String,
                default: "core"
            },
            category: {
                type: String,
                default: "core"
            },
            varArray: {
                type: Array,
                default: []
            }
        },
        {
            timestamps: true
        }
    ));
}
