"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("./schemas");
var sessionsTable = connection_1.localConnection.model(process.env.SERVERNAME + "_sessions", schemas_1.sessionsSchema);
exports.sessionsActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        sessionsTable.find(obj).exec(function (err, sessions) {
            if (err) {
                reject(err);
            }
            resolve(sessions);
        });
    });
};
exports.sessionsActionsReadLatest = function () {
    return new Promise(function (resolve, reject) {
        sessionsTable.findOne().sort({ field: "asc", createdAt: -1 }).limit(1).exec(function (err, sessions) {
            if (err) {
                reject(err);
            }
            resolve(sessions);
        });
    });
};
exports.sessionsActionsUpdate = function (obj) {
    return new Promise(function (resolve, reject) {
        sessionsTable.updateOne({ name: obj.name }, { $set: obj }, { upsert: true }, function (err, sessions) {
            if (err) {
                reject(err);
            }
            resolve(sessions);
        });
    });
};
exports.sessionsActionsSave = function (obj) {
    return new Promise(function (resolve, reject) {
        sessionsTable.find({ _id: obj._id }, function (err, sessionsObj) {
            if (err) {
                reject(err);
            }
            if (sessionsObj.length === 0) {
                var sessions = new sessionsTable(obj);
                sessions.save(function (saveErr, sessObj) {
                    if (saveErr) {
                        reject(saveErr);
                    }
                    resolve(sessObj);
                });
            }
        });
    });
};
