import {localConnection} from "../common/connection";
import {cmdQueSchema} from "./schemas";
import {ICmdQue} from "../../../typings";

const cmdQueTable = localConnection.model(process.env.SERVERNAME + "_cmdque", cmdQueSchema);

export async function cmdQueActionsGrabNextQue(obj: {
    queName: string
}) {
    return new Promise((resolve, reject) => {
        cmdQueTable.findOneAndRemove({queName: obj.queName, timeToExecute: {$lt: new Date().getTime()}}, (err, clientQue) => {
            if (err) { reject(err); }
            resolve(clientQue);
        });
    });
}

export async function cmdQueActionsSave(obj: ICmdQue) {
    return new Promise((resolve, reject) => {
        const cmdque = new cmdQueTable(obj);
        cmdque.save((err: any, saveCmdQue) => {
            if (err) { reject(err); }
            resolve(saveCmdQue);
        });
    });
}

export async function cmdQueActionsDelete(obj: {
    _id: string
}) {
    return new Promise((resolve, reject) => {
        cmdQueTable.findByIdAndRemove(obj._id, (err, cmdque) => {
            if (err) { reject(err); }
            resolve(cmdque);
        });
    });
}

export async function cmdQueActionsRemoveAll() {
    return cmdQueTable.deleteMany({});
}

export async function cmdQueActionsDropAll() {
    return cmdQueTable.collection.drop();
}
