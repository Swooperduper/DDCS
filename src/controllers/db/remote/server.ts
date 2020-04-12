import {remoteConnection} from "../common/connection";
import {serverSchema} from "../local/schemas";

const serverTable = remoteConnection.model("remotecomms", serverSchema);

export const serverActionsCreate = (obj: any) => {
    return new Promise((resolve, reject) => {
        const server = new serverTable(obj);
        server.save((err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};

export const serverActionsRead = (obj: any) => {
    return new Promise((resolve, reject) => {
        serverTable.find(obj, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};

export const serverActionsUpdate = (obj: any) => {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndUpdate(
            {name: obj.name},
            {$set: obj},
            {new: true},
            (err, servers) => {
                if (err) { reject(err); }
                resolve(servers);
            }
        );
    });
};

export const serverActionsDelete = (obj: any) => {
    return new Promise((resolve, reject) => {
        serverTable.findOneAndRemove({name: obj.name}, (err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};
