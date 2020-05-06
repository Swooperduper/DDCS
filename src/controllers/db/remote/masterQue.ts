/*
 * DDCS Licensed under AGPL-3.0 by Andrew "Drex" Finegan https://github.com/afinegan/DynamicDCS
 */

import * as ddcsController from "../../";

const masterQue = ddcsController.remoteConnection.model("masterque", ddcsController.masterQueSchema);

export async function masterQueGrabNextQue(serverName: string, obj: ddcsController.IMasterCue): Promise<void> {
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
