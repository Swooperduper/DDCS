/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function sessionsModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("session", new mongoose.Schema({
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
