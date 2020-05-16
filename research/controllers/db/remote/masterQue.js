"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("../local/schemas");
var masterQue = connection_1.remoteConnection.model("masterque", schemas_1.masterQueSchema);
exports.masterQueGrabNextQue = function (serverName, obj) {
    return new Promise(function (resolve, reject) {
        masterQue.findOneAndRemove({ serverName: serverName }, function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};
exports.masterQueSave = function (obj) {
    return new Promise(function (resolve, reject) {
        var server = new masterQue(obj);
        server.save(function (err, servers) {
            if (err) {
                reject(err);
            }
            resolve(servers);
        });
    });
};
