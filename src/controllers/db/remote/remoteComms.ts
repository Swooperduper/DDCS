import * as constants from "../../constants";
import {remoteConnection} from "../common/connection";
import {remoteCommsSchema} from "../local/schemas";

const remoteCommsTable = remoteConnection.model("remotecomms", remoteCommsSchema);

export const remoteCommsActionsCreate = (obj: any) => {
    return new Promise((resolve, reject) => {
        const crComm = new remoteCommsTable(obj);
        crComm.save((err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};

export const remoteCommsActionsRead = (obj: any) => {
    return new Promise((resolve, reject) => {
        remoteCommsTable.find(obj, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};

export const remoteCommsActionsUpdate = (obj: any) => {
    return new Promise((resolve, reject) => {
        remoteCommsTable.updateOne(
            {_id: obj._id},
            {$set: obj},
            { upsert : true },
            (err, servers) => {
                if (err) { reject(err); }
                resolve(servers);
            }
        );
    });
};

export const remoteCommsActionsDelete = (obj: any) => {
    return new Promise((resolve, reject) => {
        remoteCommsTable.findOneAndRemove({_id: obj._id}, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};

export const remoteCommsActionsRemoveNonCommPeople = (obj: any) => {
    return new Promise((resolve, reject) => {
        remoteCommsTable.deleteMany(
            {
                updatedAt: {
                    $lte: new Date(new Date().getTime() - constants.time.twoMinutes)
                }
            },
            (err) => {
                if (err) { reject(err); }
                resolve();
            }
        );
    });
};
