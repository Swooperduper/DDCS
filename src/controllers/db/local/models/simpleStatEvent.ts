/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

export function simpleStatEventModel(dbconn: mongoose.Connection): mongoose.Document | {} {

    const simpleStatEvent = new mongoose.Schema({
            sessionName: {
                type: String,
                required: true
            },
            eventCode: {
                type: String,
                required: true
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
                required: true
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
    );

    simpleStatEvent.index({sessionName: 1});

    return dbconn.model("simplestatevents", simpleStatEvent);
}
