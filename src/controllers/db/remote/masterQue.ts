
import {remoteConnection} from "../common/connection";
import {ICmdQue} from "../../../typings";
import {masterQueSchema} from "../local/schemas";

const masterQue = remoteConnection.model("masterque", masterQueSchema);

export const masterQueGrabNextQue = (serverName: string, obj: ICmdQue): Promise<ICmdQue> => {
    return new Promise((resolve, reject) => {
        masterQue.findOneAndRemove({serverName}, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
};

export const masterQueSave = (obj: ICmdQue) => {
    return new Promise((resolve, reject) => {
        const server = new masterQue(obj);
        server.save((err, servers) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};
