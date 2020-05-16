"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
exports.__esModule = true;
var mongoose = require("mongoose");
// Schema defines how chat messages will be stored in MongoDB
exports.campaignsSchema = new mongoose.Schema({
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
        "default": 0
    },
    totalMinutesPlayed_red: {
        type: Number,
        "default": 0
    }
}, {
    timestamps: true
});
