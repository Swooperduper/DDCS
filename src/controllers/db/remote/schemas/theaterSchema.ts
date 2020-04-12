/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";
const Schema = mongoose.Schema;

// Schema defines how chat messages will be stored in MongoDB
const theaterSchema = new Schema({
        _id: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        lat: {
            type: String,
            required: true
        },
        lon: {
            type: String,
            required: true
        },
        zoom: {
            type: String,
            required: true
        },
        removeSideZone: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true, // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
        upsert: true
    }
);

theaterSchema.static("findByName", function (name: string, callback: any) {
    return this.find({ name }, callback);
});

module.exports = theaterSchema;
