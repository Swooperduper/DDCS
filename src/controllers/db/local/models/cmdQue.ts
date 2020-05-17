/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as mongoose from "mongoose";

// Schema defines how chat messages will be stored in MongoDB
export function cmdQueModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model(process.env.SERVER_NAME + "_cmdque", new mongoose.Schema({
            actionObj: {
                type: Object,
                required: true
            },
            queName: {
                type: String,
                required: true
            },
            timeToExecute: {
                type: Number,
                default: 0,
                index: true
            }
        },
        {
            timestamps: true
        }
    ));
}

/*
CmdQueSchema.static('findByName', function (name, callback) {
    return this.find({ name: name }, callback);
});
*/
