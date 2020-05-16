/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as schemas from "./schemas";
import * as typings from "../../../typings";
import {remoteConnection} from "../../../";

const masterQue = remoteConnection.model("masterque", schemas.masterQueSchema);

export async function masterQueGrabNextQue(serverName: string, obj: typings.IMasterCue): Promise<void> {
    return new Promise((resolve, reject) => {
        masterQue.findOneAndRemove({serverName}, (err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}

export async function masterQueSave(obj: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = new masterQue(obj);
        server.save((err) => {
            if (err) { reject(err); }
            resolve();
        });
    });
}
