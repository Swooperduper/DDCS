/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";
export function simpleStatEventModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("simplestatevents", new mongoose.Schema({
        _id :{
            type: String,
            required: true
        },
        sessionName: {
            type: String,
        },
        eventCode: {
            type: String,
        },
        iucid: {
            type: String
        },
        iName: {
            type: String
        },
        tucid: {
            type: String
        },
        tName: {
            type: String
        },
        displaySide: {
            type: String,
        },
        roleCode: {
            type: String
        },
        msg: {
            type: String
        },
        score: {
            type: Number
        },
        showInChart: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
    ));
}
