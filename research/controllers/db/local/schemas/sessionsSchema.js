"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
exports.__esModule = true;
var mongoose = require("mongoose");
exports.sessionsSchema = new mongoose.Schema({
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
        "default": 0
    },
    totalMinutesPlayed_red: {
        type: Number,
        "default": 0
    }
}, {
    timestamps: true
});
