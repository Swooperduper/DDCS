"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("./schemas");
var cmdQueTable = connection_1.localConnection.model(process.env.SERVERNAME + "_cmdque", schemas_1.cmdQueSchema);
exports.cmdQueActionsGrabNextQue = function (obj) {
    return new Promise(function (resolve, reject) {
        cmdQueTable.findOneAndRemove({ queName: obj.queName, timeToExecute: { $lt: new Date().getTime() } }, function (err, clientQue) {
            if (err) {
                reject(err);
            }
            resolve(clientQue);
        });
    });
};
exports.cmdQueActionsSave = function (obj) {
    return new Promise(function (resolve, reject) {
        var cmdque = new cmdQueTable(obj);
        cmdque.save(function (err, saveCmdQue) {
            if (err) {
                reject(err);
            }
            resolve(saveCmdQue);
        });
    });
};
exports.cmdQueActionsDelete = function (obj) {
    return new Promise(function (resolve, reject) {
        cmdQueTable.findByIdAndRemove(obj._id, function (err, cmdque) {
            if (err) {
                reject(err);
            }
            resolve(cmdque);
        });
    });
};
exports.cmdQueActionsRemoveAll = function () {
    return cmdQueTable.deleteMany({});
};
exports.cmdQueActionsDropAll = function () {
    return cmdQueTable.collection.drop();
};
