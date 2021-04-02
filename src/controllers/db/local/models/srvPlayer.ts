/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function srvPlayerModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("srvPlayer", new mongoose.Schema({
            _id: {
                type: String
            },
            ipaddr: {
                type: String
            },
            lang: {
                type: String
            },
            name: {
                type: String
            },
            ping: {
                type: Number
            },
            side: {
                type: Number,
                min: 0,
                max: 2,
                default: 0
            },
            sideLock: {
                type: Number,
                min: 0,
                max: 2,
                default: 0
            },
            sideLockTime: {
                type: Number,
                default: 0
            },
            slot: {
                type: String
            },
            socketID: {
                type: String
            },
            playerId: {
                type: String
            },
            ucid: {
                type: String,
                required: true
            },
            sessionName: {
                type: String
            },
            curLifePoints: {
                type: Number,
                default: 0
            },
            gicTimeLeft: {
                type: Number,
                default: 20
            },
            redRSPoints: {
                type: Number,
                default: 0
            },
            blueRSPoints: {
                type: Number,
                default: 0
            },
            tmpRSPoints: {
                type: Number,
                default: 0
            },
            lastLifeAction: {
                type: String
            },
            safeLifeActionTime: {
                type: Number,
                default: 0
            },
            banned: {
                type: Boolean,
                default: false
            },
            gciAllowed: {
                type: Boolean,
                default: false
            },
            isGameMaster: {
                type: Boolean,
                default: false
            },
            cachedRemovedLPPoints: {
                type: Number,
                default: 0
            },
            currentSessionMinutesPlayed_blue: {
                type: Number,
                default: 0
            },
            currentSessionMinutesPlayed_red: {
                type: Number,
                default: 0
            },
            displayAllMessages: {
                type: Boolean,
                default: true
            },
            displayCoalitionMessages: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true
        }
    ));
}
