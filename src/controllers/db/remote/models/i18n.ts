/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function i18nModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("i18n", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            definitions: {
                type: Object
            }
        },
        {
            timestamps: true
        }
    ));
}
