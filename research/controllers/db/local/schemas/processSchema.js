"use strict";
/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */
exports.__esModule = true;
var mongoose = require("mongoose");
exports.processSchema = new mongoose.Schema({
    firingTime: {
        type: Date,
        "default": Date.now,
        required: true
    },
    queObj: {
        type: Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});
/*
processSchema.statics.findAndModify = (query: any, sort: any, doc: any, options: any, callback: any) => {
    return processSchema.collection.findAndModify(query, sort, doc, options, callback);
};
*/
