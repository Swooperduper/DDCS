import {localConnection} from "../common/connection";
import {sessionsSchema} from "./schemas";
import {ISessions} from "../../../typings";

const sessionsTable = localConnection.model(process.env.SERVERNAME + "_sessions", sessionsSchema);

export async function sessionsActionsRead(obj: any) {
    return new Promise((resolve, reject) => {
        sessionsTable.find(obj).exec((err, sessions) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsReadLatest() {
    return new Promise((resolve, reject) => {
        sessionsTable.findOne().sort({ field: "asc", createdAt: -1 }).limit(1).exec((err: any, sessions) => {
            if (err) { reject(err); }
            resolve(sessions);
        });
    });
}

export async function sessionsActionsUpdate(obj: any) {
    return new Promise((resolve, reject) => {
        sessionsTable.updateOne(
            {name: obj.name},
            {$set: obj},
            { upsert : true },
            (err, sessions) => {
                if (err) { reject(err); }
                resolve(sessions);
            }
        );
    });
}

export async function sessionsActionsSave(obj: ISessions) {
    return new Promise((resolve, reject) => {
        sessionsTable.find({_id: obj._id}, (err, sessionsObj) => {
            if (err) {reject(err); }
            if (sessionsObj.length === 0) {
                const sessions = new sessionsTable(obj);
                sessions.save((saveErr, sessObj) => {
                    if (saveErr) {reject(saveErr); }
                    resolve(sessObj);
                });
            }
        });
    });
}
