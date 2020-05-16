"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("./schemas");
var simpleStatEventTable = connection_1.localConnection.model(process.env.SERVERNAME + "_simpleStatEvent", schemas_1.simpleStatEventSchema);
exports.simpleStatEventActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        simpleStatEventTable.find({ sessionName: obj.sessionName, showInChart: true }, function (err, simpleStatEvent) {
            if (err) {
                reject(err);
            }
            resolve(simpleStatEvent);
        });
    });
};
exports.simpleStatEventActionsReadAll = function () {
    return new Promise(function (resolve, reject) {
        simpleStatEventTable.find(function (err, simpleStatEvent) {
            if (err) {
                reject(err);
            }
            resolve(simpleStatEvent);
        });
    });
};
exports.simpleStatEventActionsSave = function (obj) {
    return new Promise(function (resolve, reject) {
        var simplestatevent = new simpleStatEventTable(obj);
        simplestatevent.save(function (err, simpleStatEvent) {
            if (err) {
                reject(err);
            }
            resolve(simpleStatEvent);
        });
    });
};
