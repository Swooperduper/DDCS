"use strict";
exports.__esModule = true;
var constants = require("../../constants");
var connection_1 = require("../common/connection");
var schemas_1 = require("../local/schemas");
var remoteCommsTable = connection_1.remoteConnection.model("remotecomms", schemas_1.remoteCommsSchema);
exports.remoteCommsActionsCreate = function (obj) {
    return new Promise(function (resolve, reject) {
        var crComm = new remoteCommsTable(obj);
        crComm.save(function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.remoteCommsActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        remoteCommsTable.find(obj, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.remoteCommsActionsUpdate = function (obj) {
    return new Promise(function (resolve, reject) {
        remoteCommsTable.updateOne({ _id: obj._id }, { $set: obj }, { upsert: true }, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.remoteCommsActionsDelete = function (obj) {
    return new Promise(function (resolve, reject) {
        remoteCommsTable.findOneAndRemove({ _id: obj._id }, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.remoteCommsActionsRemoveNonCommPeople = function (obj) {
    return new Promise(function (resolve, reject) {
        remoteCommsTable.deleteMany({
            updatedAt: {
                $lte: new Date(new Date().getTime() - constants.time.twoMinutes)
            }
        }, function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};
