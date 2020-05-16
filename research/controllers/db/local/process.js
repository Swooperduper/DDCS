"use strict";
exports.__esModule = true;
var connection_1 = require("../common/connection");
var schemas_1 = require("./schemas");
var processTable = connection_1.localConnection.model(process.env.SERVERNAME + "_processque", schemas_1.processSchema);
exports.processActionsRead = function (obj) {
    return new Promise(function (resolve, reject) {
        processTable.find(obj, function (err, pQue) {
            if (err) {
                reject(err);
            }
            resolve(pQue);
        });
    });
};
exports.processActionsProcessExpired = function () {
    return new Promise(function (resolve, reject) {
        processTable.deleteMany({ firingTime: { $lt: new Date() } }, function (err) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};
exports.processActionsUpdate = function (obj) {
    return new Promise(function (resolve, reject) {
        processTable.updateOne({ _id: obj._id }, { $set: obj }, function (err, pQue) {
            if (err) {
                reject(err);
            }
            resolve(pQue);
        });
    });
};
exports.processActionsSave = function (obj) {
    return new Promise(function (resolve, reject) {
        var processque = new processTable(obj);
        processque.save(function (err, pQue) {
            if (err) {
                reject(err);
            }
            resolve(pQue);
        });
    });
};
exports.processActionsDelete = function (obj) {
    return new Promise(function (resolve, reject) {
        processTable.findByIdAndRemove(obj._id, function (err, pQue) {
            if (err) {
                reject(err);
            }
            resolve(pQue);
        });
    });
};
exports.processActionsDropAll = function () {
    processTable.collection.drop();
};
