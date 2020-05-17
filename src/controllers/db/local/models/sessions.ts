/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function sessionModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model(process.env.SERVER_NAME + "_session", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            campaignName: {
                type: String,
                required: true
            },
            startAbsTime: {
                type: Number
            },
            curAbsTime: {
                type: Number
            },
            totalMinutesPlayed_blue: {
                type: Number,
                default: 0
            },
            totalMinutesPlayed_red: {
                type: Number,
                default: 0
            }
        },
        {
            timestamps: true
        }
    ));
}
