/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

const mongoose = require('mongoose'),
Schema = mongoose.Schema;

// Schema defines how chat messages will be stored in MongoDB
const WebPushSchema = new Schema({
		payload: {
			type: Schema.Types.Mixed,
			required: true
		},
		serverName: {
			type: String,
			required: true
		},
		side: {
			type: Number,
			min: 0,
			max: 3,
			required: true
		}
	},
	{
		timestamps: true, // Saves createdAt and updatedAt as dates. createdAt will be our timestamp.
		upsert: true
	}
);

module.exports = WebPushSchema;
