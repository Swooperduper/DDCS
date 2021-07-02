/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 * Last Modified by Kirkwood
 */

import * as mongoose from "mongoose";

export function flagsModel(dbconn: mongoose.Connection): mongoose.Document | {} {
    return dbconn.model("flags", new mongoose.Schema({
		_id: {
			type: String,
			required: true
		},
		value: {
			type: Number,
			required: true,
			default:0
		}
        },
        {
            timestamps: true
        }
    ));
}