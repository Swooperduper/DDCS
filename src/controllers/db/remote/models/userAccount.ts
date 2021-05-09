/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function userAccountModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("useraccounts", new mongoose.Schema({
            authId: {
                type: String,
                required: true,
                index: { unique: true }
            },
            permLvl: {
                type: Number,
                required: true,
                default: 100
            },
            gameName: {
                type: String
            },
            realName: {
                type: String
            },
            lastIp: {
                type: String
            },
            lastServer: {
                type: String
            },
            curSocket: {
                type: String
            },
            ucid: {
                type: String
            },
            firstName: {
                type: String
            },
            lastName: {
                type: String
            },
            nickName: {
                type: String
            },
            picture: {
                type: String
            },
            gender: {
                type: String
            },
            locale: {
                type: String
            }
        },
        {
            timestamps: true
        }
    ));
}
