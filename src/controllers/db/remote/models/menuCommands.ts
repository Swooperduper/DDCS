/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function menuCommandModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("menucommand", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            sort: {
                type: Number,
                required: true
            },
            menuPath: {
                type: Array,
                required: true
            },
            side: {
                type: Number,
                default: 0
            },
            itemTitle: {
                type: String,
                required: true
            },
            cmdProp: {
                type: Object,
                required: true
            }
        },
        {
            timestamps: true
        }
    ));
}
