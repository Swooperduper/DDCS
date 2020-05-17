/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

// Schema defines how chat messages will be stored in MongoDB
export function campaignModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model(process.env.SERVER_NAME + "_campaign", new mongoose.Schema({
            _id: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
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
