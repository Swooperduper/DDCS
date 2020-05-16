"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
exports.__esModule = true;
var mongoose = require("mongoose");
// Schema defines how chat messages will be stored in MongoDB
exports.cmdQueSchema = new mongoose.Schema({
    actionObj: {
        type: Schema.Types.Mixed,
        required: true
    },
    queName: {
        type: String,
        required: true
    },
    timeToExecute: {
        type: Number,
        "default": 0,
        index: true
    }
}, {
    timestamps: true
});
/*
CmdQueSchema.static('findByName', function (name, callback) {
    return this.find({ name: name }, callback);
});
*/
