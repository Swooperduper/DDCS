"use strict";
exports.__esModule = true;
var Mongoose = require("mongoose");
exports.getDBconnections = function () {
    if (!exports.localConnection) {
        var connString = "mongodb://" + process.env.DB_LOCAL_HOST + ":27017/" + process.env.DB_LOCAL_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_LOCAL_HOST +
                ":27017/" + process.env.DB_LOCAL_DATABASE + "?authSource=admin";
        }
        exports.localConnection = Mongoose.createConnection(connString, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    if (!exports.remoteConnection) {
        var connString = "mongodb://" + process.env.DB_REMOTE_HOST + ":27017/" + process.env.DB_REMOTE_DATABASE;
        if (!!process.env.DB_USER && !!process.env.DB_PASSWORD) {
            connString = "mongodb://" + process.env.DB_USER +
                ":" + process.env.DB_PASSWORD +
                "@" + process.env.DB_REMOTE_HOST +
                ":27017/" + process.env.DB_REMOTE_DATABASE + "?authSource=admin";
        }
        exports.remoteConnection = Mongoose.createConnection(connString, { useNewUrlParser: true, useUnifiedTopology: true });
    }
};
exports.getDBconnections();
