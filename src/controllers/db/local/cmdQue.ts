import {localConnection} from "../common/connection";
import {cmdQueSchema} from "./schemas";
import {ICmdQue} from "../../../typings";

const cmdQueTable = localConnection.model(process.env.SERVERNAME + "_cmdque", cmdQueSchema);

export const cmdQueActionsGrabNextQue = (obj: {
    queName: string
}) => {
    return new Promise((resolve, reject) => {
        cmdQueTable.findOneAndRemove({queName: obj.queName, timeToExecute: {$lt: new Date().getTime()}}, (err, clientQue) => {
            if (err) { reject(err); }
            resolve(clientQue);
        });
    });
};

export const cmdQueActionsSave = (obj: ICmdQue) => {
    return new Promise((resolve, reject) => {
        const cmdque = new cmdQueTable(obj);
        cmdque.save((err: any, saveCmdQue) => {
            if (err) { reject(err); }
            resolve(saveCmdQue);
        });
    });
};

export const cmdQueActionsDelete = (obj: {
    _id: string
}) => {
    return new Promise((resolve, reject) => {
        cmdQueTable.findByIdAndRemove(obj._id, (err, cmdque) => {
            if (err) { reject(err); }
            resolve(cmdque);
        });
    });
};

export const cmdQueActionsRemoveAll = () => {
    return cmdQueTable.deleteMany({});
};

export const cmdQueActionsDropAll = () => {
    return cmdQueTable.collection.drop();
};
