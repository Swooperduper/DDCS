/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import {remoteConnection} from "../common/connection";
import {masterQueSchema} from "./schemas";
import {IMasterCue} from "../../../typings";

const masterQue = remoteConnection.model("masterque", masterQueSchema);

export async function masterQueGrabNextQue(serverName: string, obj: IMasterCue): Promise<IMasterCue> {
    return new Promise((resolve, reject) => {
        masterQue.findOneAndRemove({serverName}, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
};

export async function masterQueSave(obj: IMasterCue) {
    return new Promise((resolve, reject) => {
        const server = new masterQue(obj);
        server.save((err, servers: any) => {
            if (err) { reject(err); }
            resolve(servers);
        });
    });
};
