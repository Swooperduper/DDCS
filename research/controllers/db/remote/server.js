"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("../local/schemas");
var serverTable = connection_1.remoteConnection.model("remotecomms", schemas_1.serverSchema);
exports.serverActionsCreate = function (obj) {
    return new Promise(function (resolve, reject) {
        var server = new serverTable(obj);
        server.save(function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.serverActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        serverTable.find(obj, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.serverActionsUpdate = function (obj) {
    return new Promise(function (resolve, reject) {
        serverTable.findOneAndUpdate({ name: obj.name }, { $set: obj }, { "new": true }, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
exports.serverActionsDelete = function (obj) {
    return new Promise(function (resolve, reject) {
        serverTable.findOneAndRemove({ name: obj.name }, function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
