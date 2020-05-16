/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function remoteCommModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("remotecomm", new mongoose.Schema(
        {
            _id: {
                type: String,
                required: true
            },
            isInSRS: {
                type: Boolean,
                default: false
            },
            isInDiscord: {
                type: Boolean,
                default: false
            },
            SRSData: {
                type: Object
            }
        },
        {
            timestamps: true
        }
    ));
}
