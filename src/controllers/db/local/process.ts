import {localConnection} from "../common/connection";
import {processSchema} from "./schemas";

const processTable = localConnection.model(process.env.SERVERNAME + "_processque", processSchema);

export const processActionsRead = (obj: any) => {
    return new Promise((resolve, reject) => {
        processTable.find(obj, (err, pQue) => {
            if (err) { reject(err); }
            resolve(pQue);
        });
    });
};

export const processActionsProcessExpired = () => {
    return new Promise((resolve, reject) => {
        processTable.deleteMany(
            { firingTime: { $lt: new Date() } },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
};

export const processActionsUpdate = (obj: any) => {
    return new Promise((resolve, reject) => {
        processTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            (err, pQue) => {
                if (err) { reject(err); }
                resolve(pQue);
            }
        );
    });
};

export const processActionsSave = (obj: any) => {
    return new Promise((resolve, reject) => {
        const processque = new processTable(obj);
        processque.save((err, pQue) => {
            if (err) { reject(err); }
            resolve(pQue);
        });
    });
};

export const processActionsDelete = (obj: any) => {
    return new Promise((resolve, reject) => {
        processTable.findByIdAndRemove(obj._id, (err, pQue) => {
            if (err) { reject(err); }
            resolve(pQue);
        });
    });
};

export const processActionsDropAll = () => {
    processTable.collection.drop();
};
