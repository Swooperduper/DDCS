"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
exports.__esModule = true;
var mongoose = require("mongoose");
exports.simpleStatEventSchema = new mongoose.Schema({
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
        "default": false
    }
}, {
    timestamps: true
});
exports.simpleStatEventSchema.index({ sessionName: 1 });
